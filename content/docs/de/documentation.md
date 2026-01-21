---

title: Dokumentation

---

Willkommen zur ausführlichen Dokumentation des Admin-Bereichs. Hier finden Sie alles, was Sie über
die Anpassung Ihrer OpenAtlas-Discovery Präsentationswebsite wissen müssen!
**Wichtiger Hinweis:** Vergessen Sie nicht, Ihre Änderungen immer zu veröffentlichen (**Publish**).
Sie werden dann in wenigen Minuten auf Ihrer Präsentationsseite sichtbar sein.
Der Admin-Bereich ist in sogenannte **Collections** unterteilt. Die **Collections** sind:

- Config
- Metadata
- System Pages
- Pages
- Team

Im Folgenden werden wir auf jede einzelne genau besprechen und Ihnen zeigen, was Sie damit tun
können.

## Config
  
Die **Config**-Collection enthält die allgemeine Projektkonfiguration (_Project Config_). Hier
können Sie:
- die _Farben_ der Website bearbeiten (die Hauptfarbe und die GeoJSON-Farben, die für die Standorte
der Entitäten auf der Karte verwendet werden)
- eine Standard _Sprache_ für die Website auswählen (falls sie in mehreren Sprachen verfügbar ist)
- Ihr Projekt-_Logo_ hochladen - hier ist es ratsam, Logos für den hellen und dunklen Modus der
Website, sowie ein Logo mit und ohne Text, bereitzustellen. (Natürlich können Sie auch einfach
dasselbe Logo in allen Kategorien hochladen 😉)
- den Footer der Website mit _Cooperations-Logos_ bestücken
- die Detailansicht der Entitäten bearbeiten:  
	- Es können _Systemklassen_, auf welche die Custom-Detailansicht angewendet werden soll, ausgewählt werden
	- Es kann konfiguriert werden welche related _Systemklassen_ hervorgehoben werden sollen
	- Welche related _Systemklasse_ ganz oben stehen soll
	- Welche related _Systemklassen_ in einfacher Darstellung gezeigt werden sollen (nicht hervorgehoben)
	- Welche Entitäten per _Typ-ID_ gar nicht gezeigt werden sollen

- die Karte konfigurieren:
	- Die _Karte_ kann als Startseite für die Website gewählt werden, dann gibt es keine Index-Seite mehr.
	- Es können die _Base-Layer-URLs_ für die Karte geändert werden (ihr Aussehen verändert sich dadurch)
	- Es können _Systemklassen_ betsimmt werden, welche auf der Karte dargestellt werden sollen (dafür brauchen die Entitäten jeweils Koordinaten)
	- Der _Zoom-Level_, mit welchen auf Entitäten gezoomt wird kann geändert werden
	- Icons (Symbole) für bestimmte Typ-ID's zur Karte hinzufügen: 
		- Die _Type-ID_ 
		- Das _Symbol_ (Auswahl aus den [Lucide Icons](https://lucide.dev/))
		- Die _Farbe_
- die Bewegungsvisualisierung konfigurieren:
	- Entitäten per _Typ-ID_ können mit Farbe hervorgehoben werden
	- Es können _übereinanderliegende Bewegungen_ stärker gezeichnet werden, um somit Routen mit viel Bewegung hervorzuheben
- das Netzwerk konfigurieren:
	- Es können _Systemklassen_ vom Netzwerk ausgeschlossen werden
- ein _Impressum_ auf Ihrer Website hinzufügen (falls Sie ein/e Kooperationspartner/in von

acdh-oeaw sind, zögern Sie nicht, das acdh-Impressum zu verwenden, ansonsten können Sie Ihre

[eigene Impressumsseite](#erstellen-einer-benutzerdefinierten-impressumsseite) hinzufügen)

- den _Twitter_-Account Ihres Projekts hinzufügen, um Metadaten für Webcrawler bereitzustellen (mehr

Sichtbarkeit, hurra!)

## Metadata

Die **Metadata**-Collection enthält die _Project Metadata_. Hier müssen Sie folgende Informationen
bereitstellen:
- den Titel Ihres Projekts
- den Kurztitel Ihres Projekts
- die Beschreibung Ihres Projekts

Dies dient als Metadaten für Webcrawler, damit Ihre Website in den Google-Suchergebnissen besser
eingestuft wird. (Nochmals, mehr Sichtbarkeit für Ihr Projekt! 👍)

## System Pages
  
Die **System Pages**-Collection enthält die
- Startseite / Indexseite Ihrer Website. - Sie wird wie Ihr Projekt genannt (Standard:
_OpenAtlasDiscovery_)
- Die _Team_-Seite
In der _Index_-Datei (und der _Team_-Datei) können Sie:
- einen _Titel_ angeben (er wird die Überschrift für die Seite sein und auch in der URL angezeigt)
- einen _Navigations-Titel_ hinzufügen (er wird im Kopfbereich der Website angezeigt)
- ein _Hero-Bild_ hochladen (z. B. ein Logo für den Dunkel- und Hellmodus oder auf der Teamseite ein Foto Ihres Teams.)
- einen _Hero-Lead-in_-Text hinzufügen (wird unter dem Hero-Bild angezeigt, z. B. die Beschreibung
Ihres Projekts)
- _Links_ zu wichtigen anderen Seiten auf Ihrer Website hinzufügen (sie werden als Schaltflächen gerendert, z. B. Daten und Karte)
- zusätzliche _Inhalte_ für die Seite bereitstellen

## Pages

In der **Pages**-Collection können Sie Ihre eigenen Inhaltsseiten verwalten. Der Link zu Ihren
erstellten Seiten wird im Header auf der Präsentationsseite angezeigt. Standardmäßig gibt es eine
"Über das Projekt"-Seite.

Auch hier müssen Sie für die Erstellung einer neuen Seite Folgendes angeben:
- einen _Titel_ (er wird die Überschrift für die Seite sein und auch in der URL angezeigt)
- einen _Navigations-Titel_ (er wird im Kopfbereich der Website angezeigt)
- und natürlich den _Inhalt_ der Seite. 

### Erstellen einer benutzerdefinierten Impressumsseite

Wenn Sie Ihre benutzerdefinierte Impressumsseite erstellen möchten, müssen Sie Folgendes tun 
- setzen Sie die _Impressums_-Einstellung in der Projektkonfiguration auf _benutzerdefinierte Impressumsseite verwenden_
- erstellen Sie eine Seite mit dem _Titel_ "**Imprint**" in der **Pages**-Collection. Dies ist
obligatorisch und muss genau so geschrieben werden! (ohne Anführungszeichen natürlich) Hier können
Sie dann den Inhalt für die benutzerdefinierte Impressumsseite angeben.

## Team

In der **Team**-Collection können Sie neue Teammitglieder hinzufügen. Sie werden als Liste unter
Ihrem Inhalt in der **Sytem Pages**-Collection / _Team_-Seite angezeigt.
Beim Erstellen eines neuen Teammitglieds können Sie:
- den _Vornamen_ des Mitglieds angeben
- den _Nachnamen_ des Mitglieds angeben (dies ist obligatorisch!)
- den _akademischen Titel_ des Mitglieds angeben
- ein Foto hochladen (es wird im Profilbildstil / Kreis angezeigt)
- eine kurze Biografie des Mitglieds hinzufügen
- das Mitglied als Lead markieren (es wird dadurch in der Liste hervorgehoben)

