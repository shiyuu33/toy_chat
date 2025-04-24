'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const formSchema = z.object({
  content: z
    .string()
    .min(1, {
      message: 'Content cannot be empty.',
    })
    .max(1000, {
      message: 'Content cannot be longer than 1000 characters.',
    }),
});

export function PostForm() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let currentUser;

      // セッションがない場合は匿名サインイン
      if (!session || sessionError) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw new Error('匿名サインインに失敗しました: ' + signInError.message);
        
        currentUser = signInData.user;
        if (!currentUser) throw new Error('匿名サインイン後のユーザー情報が見つかりません');
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('ユーザー情報の取得に失敗しました: ' + (userError ? userError.message : 'ユーザーが見つかりません'));
        currentUser = user;
      }

      // 投稿を作成
      const { error: insertError } = await supabase.from('posts').insert({
        content: values.content,
        user_id: currentUser.id,
      });

      if (insertError) throw insertError;
      setToastMessage('投稿が完了しました！');
      setIsError(false);
      setShowToast(true);
      form.reset();
    } catch (error) {
      console.error('投稿エラー:', error);
      setToastMessage('投稿に失敗しました。再度試してください。');
      setIsError(true);
      setShowToast(true);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Tabs defaultValue="write" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea
                id="content"
                placeholder="Write your post here... (Markdown supported)"
                {...form.register('content')}
                className="min-h-[200px]"
              />
            </TabsContent>
            <TabsContent value="preview" className="min-h-[200px] prose">
              <ReactMarkdown>{form.watch('content') || '投稿内容がありません'}</ReactMarkdown>
            </TabsContent>
          </Tabs>
          {form.formState.errors.content && (
            <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '投稿中...' : '投稿'}
        </Button>
      </form>

      <ToastProvider>
        {showToast && (
          <Toast variant={isError ? 'destructive' : 'default'} onOpenChange={setShowToast}>
            <ToastTitle>{isError ? 'エラー' : '成功'}</ToastTitle>
            <ToastDescription>{toastMessage}</ToastDescription>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}