import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"

const DEFAULT_TOKEN_IMAGE =
  "https://cdn.imgbin.com/9/8/16/imgbin-computer-icons-question-mark-scalable-graphics-blue-question-mark-icon-white-question-mark-n3SxnveXUmn5aQ5jsUSiPZ48T.jpg"

const App: React.FC = () => {
  const { category = "", searchQuery = "" } = useParams<{ category: string; searchQuery: string }>()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery)
  const [tokens, setTokens] = useState<any[]>([])
  const [filteredTokens, setFilteredTokens] = useState<any[]>([])
  const [isLoading, setLoading] = useState<boolean>(true)
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(category || "")

  // Fetch categories only once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("https://api.github.com/repos/viaprotocol/tokenlists/contents/tokenlists")
        const data = response.data
        const fetchedCategories = data.map((file: any) => file.name.replace(".json", ""))
        setCategories(fetchedCategories)
        setCategoriesLoaded(true)

        // Navigate to the first category if the current category is not valid
        if (!category || !fetchedCategories.includes(category)) {
          navigate(`/${fetchedCategories[0]}`)
        } else {
          setSelectedCategory(category) // Set the selected category
        }
      } catch (error) {
        console.error("Failed to load categories", error)
      }
    }

    if (!categoriesLoaded) {
      fetchCategories()
    }
  }, [category, navigate, categoriesLoaded])

  // Fetch tokens based on selected category
  useEffect(() => {
    const fetchTokens = async () => {
      const currentCategory = category || categories[0]
      if (!categoriesLoaded || !currentCategory) return

      setLoading(true)
      setError(null) // Reset error before fetching

      try {
        const response = await axios.get(
          `https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/${currentCategory}.json`,
        )
        const data = response.data
        if (!Array.isArray(data) || data.length === 0) {
          setError("No tokens found")
        } else {
          setTokens(data)
          setFilteredTokens(data) // Reset filtered tokens for the new category
        }
      } catch (error) {
        console.error("Failed to load tokens", error)
        setError("Failed to load tokens")
      } finally {
        setLoading(false)
      }
    }

    fetchTokens()
  }, [category, categoriesLoaded])

  // Handle search input
  const performSearch = () => {
    if (searchTerm) {
      const searchResults = tokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredTokens(searchResults)
    } else {
      setFilteredTokens(tokens)
    }
  }

  const handleClick = (newCategory: string) => {
    setSelectedCategory(newCategory)
    // Navigate to the new category and clear the search term
    navigate(`/${newCategory}`)
    // Reset the search term
    setSearchTerm("")
    setFilteredTokens(tokens) // Show all tokens for the new category
  }

  const handleSearch = () => {
    performSearch() // Perform search when the search button is clicked
    navigate(`/${selectedCategory}/${searchTerm}`) // Update the URL with the search term
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="container mx-[32px]">
      <h1 className="font-lobster mt-[20px] text-center text-[96px] italic">Token List</h1>
      <div className="search-container mt-[50px] flex items-center justify-center">
        <input
          type="text"
          className="search br-none h-[32px] w-[384px] rounded-l-md border-[1px] border-gray-700 px-[8px] text-xl outline-none"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="submit bl-none flex h-[32px] w-[48px] items-center justify-center rounded-r-md border-[1px] border-gray-700 bg-gray-600 transition-colors duration-300 hover:bg-gray-800"
          onClick={handleSearch}
        >
          <svg height="24" width="24" viewBox="0 0 64 64">
            <circle cx="27" cy="27" r="16" stroke="white" strokeWidth="4" fill="none" />
            <line x1="41" y1="41" x2="58" y2="58" stroke="white" strokeWidth="4" />
          </svg>
        </button>
      </div>
      <div className="mt-[50px] grid grid-cols-[repeat(auto-fit,_minmax(0,_135px))] items-center justify-center gap-[25px] px-[120px] pb-[20px] sm:gap-[30px] sm:px-[70px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className={`h-[32px] w-[135px] rounded-md ${cat === selectedCategory ? "bg-[#7c7c7d] text-white" : "bg-[#2B2B47] text-white"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <main>
        <h2 className="mt-[40px] text-center font-sans text-[4rem]">
          {error
            ? error
            : filteredTokens.length > 0
              ? `${selectedCategory || categories[0]} Tokens`
              : "No tokens found"}
        </h2>
        <div className="mt-[20px] grid grid-cols-[repeat(auto-fit,_minmax(0,_128px))] justify-center gap-[30px] px-[100px] pb-[20px]">
          {isLoading
            ? Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="h-[138px] w-[138px] animate-pulse rounded-full bg-gray-300"></div>
              ))
            : filteredTokens.map((token, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-full border-2 border-gray-200"
                  style={{ minWidth: "138px", minHeight: "138px" }}
                >
                  <img
                    src={token.logoURI || DEFAULT_TOKEN_IMAGE}
                    className="h-[138px] w-[138px] cursor-pointer rounded-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => (e.currentTarget.src = DEFAULT_TOKEN_IMAGE)}
                    alt={`${selectedCategory || categories[0]} ${token.name}`}
                  />
                </div>
              ))}
        </div>
      </main>
    </div>
  )
}

export default App
