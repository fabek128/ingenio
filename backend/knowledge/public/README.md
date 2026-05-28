# Base de conocimiento publica de INGENIO/64

Esta carpeta contiene la informacion curada y versionada que el agente del sitio puede usar como contexto.

Reglas:

- Todo archivo en esta carpeta debe ser informacion publica e intencionalmente publicable.
- No incluir secretos, tokens, passwords, valores de `.env`, IPs privadas, VPN, usuarios, rutas internas ni datos de clientes.
- No incluir logs, prompts historicos, conversaciones privadas ni documentos internos de deploy.
- Si una respuesta no puede sustentarse con esta carpeta o con politicas publicas permitidas, el agente debe decir que no tiene informacion publica suficiente.
- Las imagenes deben describirse con captions curadas; no inferir datos personales desde imagenes.

Esta carpeta es una allowlist. El backend no debe cargar todo el repositorio ni toda la carpeta `docs/` como contexto del modelo.
