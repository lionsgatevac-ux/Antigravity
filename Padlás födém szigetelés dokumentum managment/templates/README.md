# 📄 DOCX Sablonok

Ez a könyvtár tartalmazza a dokumentum sablonokat, amelyeket a rendszer kitölt.

## 📋 Sablonok Listája

1. **KIVITELEZÉSI SZERZŐDÉS.docx** → `kivitelezesi_szerzodes_template.docx`
2. **Átadás átvételi jegyzőkönyv.docx** → `atadas_atveteli_template.docx`
3. **Kivitelezői nyil.jk.docx** → `kivitelezoi_nyilatkozat_template.docx`
4. **MEGÁLLAPODÁS.docx** → `megallapodas_hem_template.docx`

---

## 🔧 Sablon Konverzió

### Lépések

1. **Nyisd meg a DOCX fájlt** Word-ben
2. **Keresd meg az adatok helyét** (pl. "Név: ............")
3. **Cseréld le placeholder-re** (pl. "Név: {{customer_name}}")
4. **Mentsd el** ugyanazzal a névvel

### Placeholder Szintaxis

```text
{{placeholder_neve}}
```

**Fontos:**

- Dupla kapcsos zárójelek `{{ }}`
- Kisbetűk és aláhúzás
- Szóközök nélkül

---

## 📝 Elérhető Placeholder-ek

### Kivitelező Adatok (Fix - BO-ZSO Hungary Kft)

```text
{{contractor_name}}              - BO-ZSO Hungary Kft
{{contractor_address}}           - 2133 Sződliget HRSZ 1225/1
{{contractor_tax_number}}        - 27030110213
{{contractor_registration}}      - 13 09 201060
{{contractor_bank}}              - OTP Bank NYRT
{{contractor_account}}           - 11742104-24309413
{{contractor_email}}             - lionsgatevac@gmail.com
{{contractor_rep_name}}          - Dobai Tamás
{{contractor_rep_birth_place}}   - Budapest
{{contractor_rep_birth_date}}    - 1979.10.25
{{contractor_rep_mother}}        - Szolnoki Györgyi Juditt
{{contractor_rep_address}}       - 2613 Rád Kossuth utca 20.
```

### Projekt Adatok

```text
{{contract_number}}              - BOZSO-2025-0001
{{contract_date}}                - 2025.01.15.
{{location}}                     - Sződliget
```

### Ügyfél Adatok

```text
{{customer_name}}                - Teljes név
{{customer_birth_name}}          - Születési név
{{customer_mother_name}}         - Anyja neve
{{customer_id_number}}           - Személyi igazolvány szám
{{customer_address_full}}        - 1234 Budapest, Fő utca 1.
{{customer_phone}}               - +36 30 123 4567
{{customer_email}}               - ugyfel@example.com
```

### Ingatlan Adatok

```text
{{property_address_full}}        - 1234 Budapest, Fő utca 1.
{{hrsz}}                         - 12345/6
{{building_year}}                - 1990
{{building_type}}                - családi ház
{{heating_type}}                 - gáz kazán
{{roof_type}}                    - fa
```

### Műszaki Adatok

```text
{{gross_area}}                   - 120.50
{{chimney_area}}                 - 2.00
{{attic_door_area}}              - 1.50
{{other_deducted_area}}          - 0.00
{{net_area}}                     - 117.00
{{insulation_thickness}}         - 25
{{r_value}}                      - 6.25
```

### Dátumok

```text
{{work_start_date}}              - 2025.01.20. 08:00
{{work_end_date}}                - 2025.01.22. 16:00
{{handover_date}}                - 2025.01.23.
```

### Pénzügyi Adatok

```text
{{net_amount}}                   - 936 000 Ft
{{net_amount_words}}             - kilencszázharminchatezer forint
{{labor_cost}}                   - 200 000 Ft
{{energy_saving_gj}}             - 99.45
{{hem_value}}                    - 500 000 Ft
{{government_support}}           - 300 000 Ft
[[brszamoltertek]]               - 936 000 Ft (HEM megállapodáshoz)
```

### Anyagok

```text
[[parazarofolia]]                - Párazáró fólia
[[szigetsles]]                   - Üveggyapot / Kőzetgyapot / Fújt szigetelés
[[paraateresztofolia]]           - Páraáteresztő fólia
```

### Egyéb

```text
{{attic_door_insulated}}         - IGEN / NEM
```

---

## 📊 Táblázatok

### Anyagok Táblázat

```handlebars
{{#materials}}
| {{material_type}} | {{specification}} | {{quantity}} {{unit}} |
{{/materials}}
```

**Példa használat Word-ben:**

Hozz létre egy táblázatot, majd a sorokba írd:

```markdown
| Anyag típusa | Specifikáció | Mennyiség |
|{{material_type}}|{{specification}}|{{quantity}} {{unit}}|
```

---

## ✅ Ellenőrzési Lista

Sablon konverzió után ellenőrizd:

- [ ] Minden adat placeholder-rel van helyettesítve
- [ ] Placeholder-ek helyesen vannak írva (dupla kapcsos zárójel)
- [ ] Táblázatok megfelelően vannak jelölve
- [ ] Formázás megmaradt (félkövér, aláhúzott, stb.)
- [ ] Fejléc és lábléc rendben van
- [ ] Oldalszámozás működik

---

## 🧪 Tesztelés

1. Hozz létre egy teszt projektet a rendszerben
2. Generálj dokumentumot
3. Nyisd meg a generált DOCX-et
4. Ellenőrizd, hogy minden adat helyesen jelenik meg
5. Ha hiányzik adat vagy rossz a formázás, javítsd a sablont

---

## 💡 Tippek

### Feltételes Tartalom

Ha valami csak bizonyos esetekben jelenjen meg:

```handlebars
{{#if attic_door_insulated}}
A padlásfeljáró utólagos hőszigetelése elkészült: IGEN
{{else}}
A padlásfeljáró utólagos hőszigetelése elkészült: NEM
{{/if}}
```

### Üres Értékek

Ha egy mező üres lehet, használj alapértelmezett értéket:

```text
Telefon: {{customer_phone}}
```

Ha üres, akkor: "Telefon: "

---

## 📞 Segítség

Ha problémába ütközöl a sablonok konverziójával, nézd meg a dokumentációt vagy kérj segítséget.

**BO-ZSO Hungary Kft**  
Email: <lionsgatevac@gmail.com>
