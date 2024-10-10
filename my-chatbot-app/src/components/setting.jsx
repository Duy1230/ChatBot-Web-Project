import { useState } from "react"
import { Settings as SettingsIcon, Save, Maximize2, Database, ChevronDown } from "lucide-react"

export default function Settings() {
  const [modelName, setModelName] = useState("gpt-4o-mini")
  const [tavilyMaxResult, setTavilyMaxResult] = useState(2)
  const [imageWidth, setImageWidth] = useState(224)
  const [imageHeight, setImageHeight] = useState(224)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically save the settings to your backend or local storage
    console.log("Saving settings:", { modelName, tavilyMaxResult, imageWidth, imageHeight })
    alert("Settings saved successfully!")
  }

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center mb-4">
          <SettingsIcon className="mr-2" /> AI Model Settings
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Adjust the parameters for your AI model</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="modelName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <Database className="inline mr-2" /> Model Name
            </label>
            <div className="relative">
              <select
                id="modelName"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              >
                <option value="gpt-4o-mini">GPT-4O Mini</option>
                <option value="gpt-4o-standard">GPT-4O Standard</option>
                <option value="gpt-4o-large">GPT-4O Large</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="tavilyMaxResult" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <Maximize2 className="inline mr-2" /> Tavily Max Result
            </label>
            <input
              type="number"
              id="tavilyMaxResult"
              value={tavilyMaxResult}
              onChange={(e) => setTavilyMaxResult(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <Maximize2 className="inline mr-2" /> Image Compression
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={imageWidth}
                onChange={(e) => setImageWidth(Number(e.target.value))}
                placeholder="Width"
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
              <input
                type="number"
                value={imageHeight}
                onChange={(e) => setImageHeight(Number(e.target.value))}
                placeholder="Height"
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-100 bg-neutral-700 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            <Save className="mr-2" /> Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}