from duckduckgo_search import DDGS

query = "éttermek Vác"
print(f"Searching for (using DDGS): {query}")

try:
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=5):
            print(f"Found: {r['href']}")
            results.append(r['href'])
    
    if not results:
        print("No results found.")
    else:
        print(f"Successfully found {len(results)} results.")

except Exception as e:
    print(f"Error during search: {e}")
