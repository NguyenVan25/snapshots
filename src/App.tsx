import React, { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { FixedSizeGrid } from "react-window"

const TokenItem: React.FC<{ columnIndex: number; rowIndex: number; style: React.CSSProperties; data: any[] }> = ({
  columnIndex,
  rowIndex,
  style,
  data,
}) => {
  const token = data[rowIndex * 3 + columnIndex]
  if (!token) return null

  return (
    <div
      className="relative flex h-[125px] w-[125px] items-center justify-center gap-[20px] overflow-hidden rounded-full"
      style={style}
    >
      <img
        src={token.logoURI || DEFAULT_TOKEN_IMAGE}
        className="h-[125px] w-[125px] cursor-pointer rounded-full border-[2px] object-cover transition-transform duration-300 hover:scale-110"
        onError={(e) => (e.currentTarget.src = DEFAULT_TOKEN_IMAGE)}
        alt={`${token.name}`}
      />
    </div>
  )
}

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

  // State for grid layout
  const [columnCount, setColumnCount] = useState<number>(Math.floor((window.innerWidth - 140) / 158))
  const [gridWidth, setGridWidth] = useState<number>(window.innerWidth - 140)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("https://api.github.com/repos/viaprotocol/tokenlists/contents/tokenlists")
        const data = response.data
        const fetchedCategories = data.map((file: any) => file.name.replace(".json", ""))
        setCategories(fetchedCategories)
        setCategoriesLoaded(true)

        if (!category || !fetchedCategories.includes(category)) {
          navigate(`/${fetchedCategories[0]}`)
        } else {
          setSelectedCategory(category)
        }
      } catch (error) {
        console.error("Failed to load categories", error)
      }
    }

    if (!categoriesLoaded) {
      fetchCategories()
    }
  }, [category, navigate, categoriesLoaded])

  useEffect(() => {
    const fetchTokens = async () => {
      const currentCategory = category || categories[0]
      if (!categoriesLoaded || !currentCategory) return

      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(
          `https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/${currentCategory}.json`,
        )
        const data = response.data
        if (!Array.isArray(data) || data.length === 0) {
          setError("No tokens found")
        } else {
          setTokens(data)
          setFilteredTokens(data)
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
    navigate(`/${newCategory}`)
    setSearchTerm("")
    setFilteredTokens(tokens)
  }

  const handleSearch = () => {
    performSearch()
    navigate(`/${selectedCategory}/${searchTerm}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch()
    }
  }

  // Update grid layout on window resize
  const handleResize = useCallback(() => {
    setGridWidth(window.innerWidth - 140)
    setColumnCount(Math.floor((window.innerWidth - 140) / 158))
  }, [])

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize])

  return (
    <div className="container mx-auto px-4">
      <h1 className="mt-4 text-center font-lobster text-6xl italic">Token List</h1>
      <div className="search-container mt-12 flex items-center justify-center">
        <input
          type="text"
          className="search h-8 w-full max-w-xl rounded-l-md border border-gray-700 px-2 text-xl outline-none"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="submit flex h-8 w-12 items-center justify-center rounded-r-md border border-gray-700 bg-gray-600 text-white transition-colors duration-300 hover:bg-gray-800"
          onClick={handleSearch}
        >
          <svg height="24" width="24" viewBox="0 0 64 64">
            <circle cx="27" cy="27" r="16" stroke="white" strokeWidth="4" fill="none" />
            <line x1="41" y1="41" x2="58" y2="58" stroke="white" strokeWidth="4" />
          </svg>
        </button>
      </div>
      <div className="mt-12 grid grid-cols-[repeat(auto-fit,_minmax(0,_128px))] justify-center gap-[30px] px-[100px] pb-[20px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className={`h-8 w-32 rounded-md ${cat === selectedCategory ? "bg-gray-600 text-white" : "bg-gray-800 text-white"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="overflow-hidden px-[70px]">
        <h2 className="mt-10 text-center text-3xl">
          {error
            ? error
            : filteredTokens.length > 0
              ? `${selectedCategory || categories[0]} Tokens`
              : "No tokens found"}
        </h2>
        <div className="relative" style={{ width: "100%", height: "600px" }}>
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,_128px))] gap-4 p-4">
              {[...Array(20)].map((_, index) => (
                <div key={index} className="h-[125px] w-[125px] animate-pulse rounded-full bg-gray-200" />
              ))}
            </div>
          ) : (
            <FixedSizeGrid
              columnCount={columnCount}
              columnWidth={158}
              height={600}
              rowCount={Math.ceil(filteredTokens.length / columnCount)}
              rowHeight={158}
              width={gridWidth}
              itemData={filteredTokens}
            >
              {TokenItem}
            </FixedSizeGrid>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
