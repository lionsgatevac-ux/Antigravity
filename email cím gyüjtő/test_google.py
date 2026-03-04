try:
    from googlesearch import search
except ImportError:
    print("googlesearch-python not installed")
    exit(1)

query = "éttermek Vác"
print(f"Searching for: {query}")

try:
    results = []
    for url in search(query, num_results=5, lang="hu"):
        print(f"Found: {url}")
        results.append(url)
    
    if not results:
        print("No results found.")
    else:
        print(f"Successfully found {len(results)} results.")

except Exception as e:
    print(f"Error during search: {e}")
