import { useState, useEffect } from "react"
import { Settings as SettingsIcon, Save, Maximize2, Database, ChevronDown } from "lucide-react"
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export default function Settings() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [modelName, setModelName] = useState("gpt-4o-mini")
  const [tavilyMaxResult, setTavilyMaxResult] = useState(2)
  const [imageWidth, setImageWidth] = useState(224)
  const [imageHeight, setImageHeight] = useState(224)

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => setIsSuccess(false), 3000)
    }
  }, [isSuccess])

  useEffect(() => {
    const settings = api.get("/settings/getSettings").then((res) => {
      setModelName(res.data.MODEL_NAME)
      setTavilyMaxResult(res.data.TAVILY_MAX_RESULT)
      setImageWidth(res.data.IMAGE_WIDTH)
      setImageHeight(res.data.IMAGE_HEIGHT)
    })
  }, [])

  const handlePositiveInteger = (target, setter) => {
    const intValue = Math.floor(Number(target.value))
    if (intValue > 0) {
      setter(intValue)
    }

    if (target.id === "tavilyMaxResult" && intValue > 10) {
      setter(10)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post("/settings/updateSettings", { "MODEL_NAME": modelName, "TAVILY_MAX_RESULT": tavilyMaxResult, "IMAGE_WIDTH": imageWidth, "IMAGE_HEIGHT": imageHeight })
    setIsSuccess(true)
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
                <option value="gpt-4o-mini">GPT-4o-mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="o1-mini">O1-mini</option>
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
              onChange={(e) => handlePositiveInteger(e.target, setTavilyMaxResult)}
              min="1"
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
                onChange={(e) => handlePositiveInteger(e.target, setImageWidth)}
                placeholder="Width"
                min="1"
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
              <input
                type="number"
                value={imageHeight}
                onChange={(e) => handlePositiveInteger(e.target, setImageHeight)}
                placeholder="Height"
                min="1"
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-100 bg-neutral-700 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
            onClick={handleSubmit}
          >
            <Save className="mr-2" /> Save Changes
          </button>
        </form>
        {isSuccess && <p className="text-green-500 text-center mt-4">Settings saved successfully!</p>}
      </div>
    </div>
  )
}