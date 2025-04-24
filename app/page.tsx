import { PostForm } from "@/components/post-form";
import { PostList } from "@/components/post-list";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Toy Chat</h1>
        <PostForm />
        <div className="mt-8">
          <PostList />
        </div>
      </main>
    </div>
  );
}