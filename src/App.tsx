import React, { useEffect, useState } from "react"

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  chainId: number
  logoURI: string
  coingeckoId?: string
  listedIn?: string[]
}

const API_ENDPOINTS: { [key: string]: string } = {
  Ethereum: "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/ethereum.json",
  Arbitrum: "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/arbitrum.json",
  Optimism: "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/optimism.json",
  Bsc: "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/bsc.json",
}

const Loading: React.FC = () => {
  return <div className="h-[138px] w-[138px] animate-pulse rounded-full bg-gray-300"></div>
}

const App: React.FC = () => {
  const [category, setCategory] = useState<string>("Ethereum")
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(API_ENDPOINTS[category])
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        return response.json()
      })
      .then((data: Token[]) => {
        setTokens(data)
        setFilteredTokens(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error)
        setLoading(false)
      })
  }, [category])

  const updateURL = (newCategory: string, newSearchTerm: string) => {
    const path = `${window.location.origin}/${newCategory}${newSearchTerm ? `/${newSearchTerm}` : ""}`
    window.history.pushState({}, "", path)
  }

  const handleClick = (selectedCategory: string) => {
    setCategory(selectedCategory)
    setSearchTerm("")
    updateURL(selectedCategory, "")
  }

  const handleSearch = () => {
    setFilteredTokens(
      tokens.filter(
        (token) =>
          token.symbol.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          token.chainId.toString().startsWith(searchTerm.toLowerCase()),
      ),
    )
    updateURL(category, searchTerm)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleMouseEnter = (token: Token) => {
    setHoveredToken(token)
  }

  const handleMouseLeave = () => {
    setHoveredToken(null)
  }

  const DEFAULT_TOKEN_IMAGE =
    "https://cdn.imgbin.com/9/8/16/imgbin-computer-icons-question-mark-scalable-graphics-blue-question-mark-icon-white-question-mark-n3SxnveXUmn5aQ5jsUSiPZ48T.jpg"

  return (
    <div className="container mx-[32px]">
      <h1 id="one" className="font-lobster mt-[20px] text-center text-[6rem] italic">
        SnapShot
      </h1>
      <div className="search-container mt-[50px] flex items-center justify-center">
        <input
          type="text"
          className="search br-none h-[32px] w-[384px] rounded-l-md border-[1px] border-gray-700 px-[8px] text-xl outline-none"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyPress}
        />
        <button
          type="button"
          className="submit bl-none flex h-[32px] w-[48px] items-center justify-center rounded-r-md border-[1px] border-gray-700 bg-gray-600 transition-colors duration-300 hover:bg-gray-800 "
          onClick={handleSearch}
        >
          <svg height="24" width="24" viewBox="0 0 64 64">
            <circle cx="27" cy="27" r="16" stroke="white" strokeWidth="4" fill="none" />
            <line x1="41" y1="41" x2="58" y2="58" stroke="white" strokeWidth="4" />
          </svg>
        </button>
      </div>
      <div className="button mt-[40px] flex justify-center gap-[20px]">
        <button
          onClick={() => handleClick("Ethereum")}
          className=" h-[32px] w-[96px] rounded-md bg-gray-900 text-white"
        >
          Ethereum
        </button>
        <button onClick={() => handleClick("Arbitrum")} className="h-[32px] w-[96px] rounded-md bg-gray-900 text-white">
          Arbitrum
        </button>
        <button onClick={() => handleClick("Optimism")} className="h-[32px] w-[96px] rounded-md bg-gray-900 text-white">
          Optimism
        </button>
        <button onClick={() => handleClick("Bsc")} className="h-[32px] w-[96px] rounded-md bg-gray-900 text-white">
          Bsc
        </button>
      </div>
      <div>
        <h2 className="mt-[40px] text-center font-sans text-[4rem]">
          {filteredTokens.length > 0 ? `${category} Tokens` : "No tokens found"}
        </h2>
        <div className="mt-[20px] grid grid-cols-[repeat(auto-fit,_minmax(0,_138px))] justify-center gap-[25px] px-[130px] pb-[20px]">
          {isLoading
            ? Array.from({ length: 20 }).map((_, index) => <Loading key={index} />)
            : filteredTokens.map((token, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-full border-2 border-gray-200"
                  style={{ minWidth: "138px", minHeight: "138px" }}
                  onMouseEnter={() => handleMouseEnter(token)}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={token.logoURI ? token.logoURI : DEFAULT_TOKEN_IMAGE}
                    className="h-[138px] w-[138px] cursor-pointer rounded-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => (e.currentTarget.src = DEFAULT_TOKEN_IMAGE)}
                    alt={token.symbol}
                  />
                  {hoveredToken === token && (
                    <div className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 transform whitespace-nowrap rounded-lg bg-black bg-opacity-80 p-[8px] text-[12px] text-white">
                      <p>
                        <strong>Name:</strong> {token.name}
                      </p>
                      <p>
                        <strong>Logo URI:</strong>{" "}
                        <a
                          href={token.logoURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:underline"
                        >
                          Open Image
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}

export default App
