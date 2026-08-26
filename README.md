# SOS – Studerendes Oftalmologiske Selskab

Statisk website for basisgruppen SOS ved Københavns Universitet (sosbasisgruppe.dk).

Sitet fortæller om foreningen, bestyrelsen og kontakt og rummer to undervisningsværktøjer til medicinstuderende.

## Indhold

- index.html – forside (om os, bestyrelse, Facebook, sponsorater, kontakt og værktøjer)
- css/sos.css – fælles udseende (farver, navigation, kort, simulator-layout)
- js/nav.js – mobilmenu
- oct-simulator/ – OCT-atlas og quiz
- fundus-simulator/ – fundusatlas og quiz
- netlify.toml – publiceringsrod (ingen build)

Bestyrelse og kontakt er de oplysninger, foreningen selv viser: Katrine Mikha (formand), Kira Scher (næstformand), basisgruppeofta@gmail.com og telefon +45 42 20 13 40. Der er ikke opfundet ekstra medlemmer, events eller sponsorer.

## Simulatorerne

Begge værktøjer har to faner.

### Atlas

Skematiske, mærkede illustrationer tegnet i browseren (canvas). De er originale undervisningstegninger, ikke kliniske fotos hentet fra nettet.

OCT viser et gråtone B-scan af makula (ILM til RPE/choroidea med foveagrube) for: Normal fovea, Druser (tør AMD), CNV / våd AMD, DME, Maculahul, Epiretinal membran, CSC og Vitreomakulær traktion.

Fundus viser et skematisk højre øje for normal, tør/våd AMD, NPDR, PDR, papilødem, glaukom, CRVO, arterioleokklusion og amotio retinae.

Piletaster skifter diagnose i atlaset.

### Test

OCT-test henter rigtige scans fra oct-simulator/data.json og mappen Billeder/. Du vælger mellem Normal, CNV, DME og druser. Score og streak vises, og der gives kort dansk feedback. Tasterne 1-4 vælger svar, Enter går videre. Hvis et billede mangler, vises den skematiske OCT for samme diagnose, så feltet aldrig er tomt.

Fundus-test bruger de samme skitser som atlaset (uden labels) som opgavebillede. Mindst ti tilfælde, fire svarmuligheder.

## Køre lokalt
Fra mappen kan du vise filerne med en almindelig lokal webserver.

## Netlify
Publicer mappen som statisk site. Publish directory er roden (netlify.toml). Tilknyt gerne det rigtige domæne. Ingen hemmeligheder eller analytics-nøgler i koden.
