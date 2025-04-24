import { PostForm } from "@/components/post-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Q&A Platform</h1>
        <PostForm />
      </main>
    </div>
  )
}