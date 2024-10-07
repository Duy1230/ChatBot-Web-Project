import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"

export default function WelcomeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-lg shadow-lg p-6 text-white max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-500">Welcome to AI Chat</h1>
        <MessageSquare className="w-10 h-10" />
      </div>
      <p className="text-lg mb-4">Your intelligent conversation partner, ready to assist you 24/7.</p>
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm font-medium">Start your journey with AI Chat:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Ask questions on any topic</li>
          <li>Get help with problem-solving</li>
          <li>Explore new ideas and concepts</li>
        </ul>
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-1 bg-gradient-to-r from-yellow-300 to-orange-500 mt-6 rounded-full"
      />
      <p className="text-center mt-4 font-medium">Type your message below to begin</p>
    </motion.div>
  )
}