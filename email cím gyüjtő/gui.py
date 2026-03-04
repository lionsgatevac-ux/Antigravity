import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import subprocess
import threading
import os
import datetime
import pandas as pd
import pandas as pd
import re
from duckduckgo_search import DDGS

class EmailCollectorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Magyar Email Gyűjtő v2.0")
        self.root.geometry("800x600")
        
        # Style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Header
        header_frame = ttk.Frame(root, padding="10")
        header_frame.pack(fill=tk.X)
        
        ttk.Label(header_frame, text="Email Gyűjtő Program", font=("Helvetica", 16, "bold")).pack()
        ttk.Label(header_frame, text="Add meg a weboldalt, ahonnan a keresést indítani szeretnéd.", font=("Helvetica", 10)).pack()

        # Tabs for Different Modes
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Tab 1: Direct URL
        self.tab_url = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.tab_url, text="URL Megadása")
        
        ttk.Label(self.tab_url, text="Kezdő Weboldal (pl. https://www.startlap.hu):").pack(anchor=tk.W)
        self.url_entry = ttk.Entry(self.tab_url, width=60)
        self.url_entry.pack(fill=tk.X, pady=5)
        self.url_entry.insert(0, "https://www.startlap.hu")

        # Tab 2: Google/Web Search
        self.tab_search = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(self.tab_search, text="Webes Keresés (Google/DDG)")
        
        ttk.Label(self.tab_search, text="Keresőszó (pl. 'éttermek Vác és környéke'):").pack(anchor=tk.W)
        self.search_entry = ttk.Entry(self.tab_search, width=60)
        self.search_entry = ttk.Entry(self.tab_search, width=60)
        self.search_entry.pack(fill=tk.X, pady=5)
        
        ttk.Button(self.tab_search, text="Kulcsszavak betöltése fájlból (.txt)", command=self.load_keywords).pack(anchor=tk.W, pady=2)
        self.keyword_list = []
        
        # Tab 3: CompanyWall (Settings)
        # We can move auth fields here or keep them strictly for CompanyWall mode? 
        # Requirement said: Login fields are for CompanyWall.
        # Let's keep CompanyWall Auth visible but maybe specific.
        
        # Moving InputFrame content into Tab 1 mostly, but keeping 'Save location' global
        
        # Global Settings Frame (below tabs)
        settings_frame = ttk.Frame(root, padding="10")
        settings_frame.pack(fill=tk.X)
        
        # Absolute path for robust handling
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.output_filename = os.path.join(self.base_dir, "emails.csv")
        
        # Output Info
        ttk.Label(settings_frame, text=f"Mentés helye: {self.output_filename}", font=("Consolas", 8)).pack(anchor=tk.W, pady=2)

        # Authentication Frame (CompanyWall)
        auth_frame = ttk.LabelFrame(root, text="CompanyWall Bejelentkezés (Opcionális)", padding="10")
        auth_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(auth_frame, text="Email:").pack(side=tk.LEFT)
        self.email_entry = ttk.Entry(auth_frame, width=30)
        self.email_entry.pack(side=tk.LEFT, padx=5)
        
        ttk.Label(auth_frame, text="Jelszó:").pack(side=tk.LEFT)
        self.password_entry = ttk.Entry(auth_frame, width=30, show="*")
        self.password_entry.pack(side=tk.LEFT, padx=5)


        # Buttons
        button_frame = ttk.Frame(root, padding="10")
        button_frame.pack(fill=tk.X)
        
        self.start_button = ttk.Button(button_frame, text="KERESÉS INDÍTÁSA", command=self.start_crawling)
        self.start_button.pack(pady=10, fill=tk.X)
        
        # Stats & Export
        stats_frame = ttk.Frame(root, padding="10")
        stats_frame.pack(fill=tk.X)
        
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(stats_frame, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, pady=(0, 5))
        
        self.count_label = ttk.Label(stats_frame, text="Talált emailek száma: 0", font=("Helvetica", 10, "bold"))
        self.count_label.pack(side=tk.LEFT, padx=10)
        
        self.export_button = ttk.Button(stats_frame, text="EXPORTÁLÁS EXCELBE", command=self.export_to_excel, state='disabled')
        self.export_button.pack(side=tk.RIGHT, padx=10)

        # Results Area (Treeview)
        result_frame = ttk.LabelFrame(root, text="Valós Idejű Találatok", padding="10")
        result_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Treeview
        columns = ("email", "source", "keyword")
        self.tree = ttk.Treeview(result_frame, columns=columns, show='headings')
        self.tree.heading("email", text="Email")
        self.tree.heading("source", text="Forrás URL")
        self.tree.heading("keyword", text="Eredet (Kulcsszó)")
        
        self.tree.column("email", width=200)
        self.tree.column("source", width=300)
        self.tree.column("keyword", width=150)
        
        scrollbar = ttk.Scrollbar(result_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Log Area (Small)
        log_frame = ttk.LabelFrame(root, text="Napló", padding="5")
        log_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.log_text = scrolledtext.ScrolledText(log_frame, height=5, state='disabled', font=("Consolas", 8))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
    def log(self, message):
        self.log_text.config(state='normal')
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state='disabled')

    def load_keywords(self):
        filename = filedialog.askopenfilename(filetypes=[("Text files", "*.txt")])
        if filename:
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    lines = [line.strip() for line in f if line.strip()]
                
                if lines:
                    self.keyword_list = lines
                    self.search_entry.delete(0, tk.END)
                    self.search_entry.insert(0, f"[FÁJLBÓL BETÖLTVE: {len(lines)} db kulcsszó]")
                    messagebox.showinfo("Siker", f"{len(lines)} kulcsszó sikeresen betöltve!")
                else:
                    messagebox.showwarning("Figyelem", "A fájl üres volt.")
            except Exception as e:
                messagebox.showerror("Hiba", f"Nem sikerült betölteni: {e}")

    def start_crawling(self):
        # Determine mode based on active tab
        current_tab_index = self.notebook.index(self.notebook.select())
        
        mode = "url"
        target = ""
        
        if current_tab_index == 0: # URL Mode
            mode = "url"
            target = self.url_entry.get().strip()
            if not target:
                messagebox.showerror("Hiba", "Kérlek adj meg egy URL-t!")
                return
            if not target.startswith("http"):
                target = "https://" + target
                self.url_entry.delete(0, tk.END)
                self.url_entry.insert(0, target)
                
        elif current_tab_index == 1: # Search Mode
            mode = "search"
            target = self.search_entry.get().strip()
            if not target:
                messagebox.showerror("Hiba", "Kérlek adj meg egy keresőszót!")
                return
        # Determine targets
        targets = []
        if mode == 'url':
             targets = [target]
        elif mode == 'search':
             if self.keyword_list and target.startswith("[FÁJLBÓL BETÖLTVE:"):
                 targets = self.keyword_list
             else:
                 # User might have typed a single keyword manually
                 targets = [target]

        self.start_button.config(state='disabled', text="FUTTATÁS ALATT...")
        self.log(f"--- Mód: {mode.upper()}, Célok száma: {len(targets)} ---")
        
        # Run in thread
        thread = threading.Thread(target=self.run_process, args=(mode, targets))

        self.start_button.config(state='disabled', text="FUTTATÁS ALATT...")
        # Run in thread to not freeze GUI
        # thread = threading.Thread(target=self.run_process, args=(url,)) -> Moved up
        thread.start()

    def add_result_to_gui(self, email, source, keyword):
        self.tree.insert("", tk.END, values=(email, source, keyword))
        # Auto scroll to bottom
        self.tree.yview_moveto(1)
        # Update counter
        count = len(self.tree.get_children())
        self.count_label.config(text=f"Talált emailek száma: {count}")

    def run_process(self, mode, targets):
        # Clear previous results in Treeview?
        # Maybe typically we want to keep them or clear? 
        # Let's clear for a fresh run
        for i in self.tree.get_children():
            self.tree.delete(i)
            
        self.progress_var.set(0)
        
        # Master loop for targets
        total = len(targets)
        for i, target in enumerate(targets, 1):
            if mode == 'search':
                self.root.after(0, self.log, f"--- Feldolgozás ({i}/{total}): '{target}' ---")
            else:
                self.root.after(0, self.log, f"--- Feldolgozás ({i}/{total}): URL ---")
            
            # Update Progress (Base for this step)
            base_progress = ((i - 1) / total) * 100
            self.root.after(0, lambda p=base_progress: self.progress_var.set(p))
            
            # Use a temporary file for the current run (Absolute path)
            self.temp_filename = os.path.join(self.base_dir, "temp_emails.csv")
            if os.path.exists(self.temp_filename):
                try:
                    os.remove(self.temp_filename)
                except:
                    pass
            
            # Get auth data (refreshing not needed but good measure)
            email = self.email_entry.get().strip()
            password = self.password_entry.get().strip()

            # SEARCH LOGIC
            start_urls = []
            if mode == 'search':
                self.root.after(0, self.log, "Google/DDG Keresés folyamatban...")
                try:
                    # Also extract emails directly from search snippets/body!
                    snippet_emails = []
                    email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

                    try:
                        with DDGS() as ddgs:
                            # Fetching
                            results = list(ddgs.text(target, max_results=15))
                            for r in results:
                                start_urls.append(r['href'])
                                
                                # Check body for emails
                                if 'body' in r:
                                    found = re.findall(email_regex, r['body'])
                                    for em in found:
                                        # Simple Validation
                                        if len(em) < 70 and not em.endswith(('.png', '.jpg', '.gif', '.css', '.js', '.svg', '.webp')):
                                            snippet_emails.append({
                                                'email': em.lower().strip(),
                                                'source_url': r['href'], # Best guess source
                                                'found_at': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                                'keyword': target + " (Snippet)"
                                            })
                                            # Add to GUI immediately
                                            self.root.after(0, self.add_result_to_gui, em.lower().strip(), r['href'], target + " (Snippet)")
                                        
                    except Exception as e:
                        self.root.after(0, self.log, f"Hiba a keresés során: {e}")
                        # Continue to next target instead of return
                        continue
                    
                    if not start_urls:
                        self.root.after(0, self.log, f"Nem találtam weboldalakat ehhez: {target}")
                        continue
                        
                    self.root.after(0, self.log, f"Talált URL-ek száma: {len(start_urls)}")
                except Exception:
                     pass 
            else:
                start_urls = [target]

            # Prepare search_keyword argument
            search_keyword = target if mode == 'search' else f"Start URL: {target}"

            command = [
                "scrapy", "crawl", "email_spider",
                "-s", "CLOSESPIDER_PAGECOUNT=100"
            ]
            
            # Passing multiple start_urls is tricky via CLI args individually
            # We will pass them as a comma separated string and handle in spider?
            # OR just pass the first one and let others be arguments?
            # Scrapy allows multiple -a arguments but usually for different keys.
            # Best way: pass a single argument 'start_urls_list' containing comma separated list
            
            urls_str = ",".join(start_urls)
            command.extend(["-a", f"start_urls_list={urls_str}"])
            command.extend(["-a", f"search_keyword={search_keyword}"])
            
            if email and password:
                command.extend(["-a", f"email={email}", "-a", f"password={password}"])

            # Save snippet emails to a temporary file too (or direct append later?)
            # Let's write them to a separate temp file for snippet results
            self.snippet_temp_filename = os.path.join(self.base_dir, "temp_snippets.csv")
            if mode == 'search' and snippet_emails:
                df_snippets = pd.DataFrame(snippet_emails)
                try:
                    df_snippets.to_csv(self.snippet_temp_filename, index=False)
                    self.root.after(0, self.log, f"Talált emailek a leírásokban: {len(snippet_emails)}")
                except Exception as e:
                    pass

            
            try:
                # We need to run this command in the project root
                cwd = os.path.dirname(os.path.abspath(__file__))
                
                process = subprocess.Popen(
                    command, 
                    cwd=cwd,
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE,
                    text=True,
                    encoding='utf-8',
                    errors='replace', # Fix for Windows encoding issues
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                )
                
                # Read stderr (Scrapy logs to stderr)
                while True:
                    line = process.stderr.readline()
                    if not line:
                        break
                    
                    # Parse Scraped items from logs for Real-time GUI
                    # Log format: "{'email': '...', 'source_url': '...', 'keyword': '...'}"
                    if "{'email':" in line:
                         try:
                             # Extract dict string
                             # Simple regex or string manipulation
                             dict_str = line.strip().split("Scraped from <200")[0].strip() # Cleanup if needed?
                             # Actually standard log: [email_spider] DEBUG: Scraped from <200 http...>: {'email': '...'}
                             if "{" in line and "}" in line:
                                 json_part = line[line.find("{"):line.rfind("}")+1]
                                 # unsafe eval is risky but Scrapy output is trusted here for display
                                 import ast
                                 item = ast.literal_eval(json_part)
                                 self.root.after(0, self.add_result_to_gui, item.get('email'), item.get('source_url'), item.get('keyword'))
                         except:
                             pass

                    # Filter some logs to be cleaner
                    if any(k in line for k in ["Scraped from", "item_scraped", "Login", "Parsing", "ERROR", "INFO"]):
                        self.root.after(0, self.log, line.strip())
                
                process.wait()
                
                # Merge logic
                self.merge_results()
                
            except Exception as e:
                self.root.after(0, self.log, f"Kritikus hiba: {str(e)}")
                
        # End of master loop
        self.root.after(0, lambda: self.progress_var.set(100))
        self.root.after(0, self.on_process_finish)

    def merge_results(self):
        try:
            if not os.path.exists(self.temp_filename):
                return

            new_data = pd.read_csv(self.temp_filename)
            
            if os.path.exists(self.output_filename):
                existing_data = pd.read_csv(self.output_filename)
                
                # Check for snippet results
                snippet_data = pd.DataFrame()
                snippet_file = os.path.join(self.base_dir, "temp_snippets.csv")
                if os.path.exists(snippet_file):
                     try:
                        snippet_data = pd.read_csv(snippet_file)
                        os.remove(snippet_file)
                     except:
                        pass
                
                # Combine all
                combined = pd.concat([existing_data, new_data, snippet_data])
                # Deduplicate based on email
                combined.drop_duplicates(subset=['email'], keep='first', inplace=True)
                combined.to_csv(self.output_filename, index=False)
            else:
                 # Check for snippet results
                snippet_data = pd.DataFrame()
                snippet_file = os.path.join(self.base_dir, "temp_snippets.csv")
                if os.path.exists(snippet_file):
                     try:
                        snippet_data = pd.read_csv(snippet_file)
                        os.remove(snippet_file)
                     except:
                        pass
                
                combined = pd.concat([new_data, snippet_data])
                combined.to_csv(self.output_filename, index=False)
            
            # Cleanup temp
            os.remove(self.temp_filename)
            self.root.after(0, self.log, f"--- {len(new_data) + len(snippet_data)} új találat feldolgozva és hozzáadva. ---")
            
        except Exception as e:
            self.root.after(0, self.log, f"Hiba az összefésülésnél: {str(e)}")

    def update_stats(self):
        try:
            if os.path.exists(self.output_filename):
                df = pd.read_csv(self.output_filename)
                count = len(df)
                self.count_label.config(text=f"Talált emailek száma: {count}")
                if count > 0:
                    self.export_button.config(state='normal')
                else:
                    self.export_button.config(state='disabled')
            else:
                self.count_label.config(text="Talált emailek száma: 0")
                self.export_button.config(state='disabled')
        except Exception:
            pass # File might be empty or locked

    def on_process_finish(self):
        self.start_button.config(state='normal', text="KERESÉS INDÍTÁSA")
        self.log("--- Keresés befejeződött! ---")
        self.update_stats()
        messagebox.showinfo("Kész", f"A keresés kész!\nEllenőrizd az eredményeket.")

    def export_to_excel(self):
        if not os.path.exists(self.output_filename):
            messagebox.showerror("Hiba", "Nincs mit exportálni!")
            return
            
        target_file = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel fájl", "*.xlsx")],
            title="Mentés másként"
        )
        
        if target_file:
            try:
                df = pd.read_csv(self.output_filename)
                df.to_excel(target_file, index=False)
                messagebox.showinfo("Siker", f"Sikeresen mentve:\n{target_file}")
            except Exception as e:
                messagebox.showerror("Hiba", f"Sikertelen mentés:\n{str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = EmailCollectorGUI(root)
    root.mainloop()
