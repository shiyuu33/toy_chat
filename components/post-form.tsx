"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useState } from "react"

const formSchema = z.object({
  content: z
    .string()
    .min(1, {
      message: "Content cannot be empty.",
    })
    .max(1000, {
      message: "Content cannot be longer than 1000 characters.",
    }),
})

export function PostForm() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // TODO: Implement Supabase integration
      console.log(values)
      setToastMessage("Post submitted successfully!")
      setIsError(false)
      setShowToast(true)
      form.reset()
    } catch (error) {
      setToastMessage("Failed to submit post. Please try again.")
      setIsError(true)
      setShowToast(true)
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
                {...form.register("content")}
                className="min-h-[200px]"
              />
            </TabsContent>
            <TabsContent value="preview" className="min-h-[200px] prose">
              <ReactMarkdown>{form.watch("content") || "Nothing to preview"}</ReactMarkdown>
            </TabsContent>
          </Tabs>
          {form.formState.errors.content && (
            <p className="text-sm text-red-500">
              {form.formState.errors.content.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Posting..." : "Post"}
        </Button>
      </form>

      <ToastProvider>
        {showToast && (
          <Toast
            variant={isError ? "destructive" : "default"}
            onOpenChange={setShowToast}
          >
            <ToastTitle>{isError ? "Error" : "Success"}</ToastTitle>
            <ToastDescription>{toastMessage}</ToastDescription>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </div>
  )
}