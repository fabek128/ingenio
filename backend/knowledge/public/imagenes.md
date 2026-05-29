# Imagenes publicas

## fabian-profile.jpg

Descripcion publica: imagen de perfil usada en el sitio para representar a Fabian.

Reglas:

- Se puede mencionar que el sitio usa una imagen de perfil publica.
- No inferir edad, ubicacion, identidad legal, salud, datos biometricos ni informacion sensible desde la imagen.
- No describir elementos no documentados explicitamente.

## Otto (bulldog ingles)

Otto es un perro bulldog ingles de Fabian. Es parte de su vida personal.

Datos basicos (responder siempre):

- Raza: bulldog ingles
- Peso: 35 kilos
- Es un perro grande e imponente
- Fotos disponibles en `/uploads/thumbs/` con originales en `/uploads/`

Informacion de salud (responder SOLO si el usuario pregunta explicitamente por su salud, enfermedad o tratamiento):

Otto nacio en 2012. Tiene tumores perianales. En un momento avanzaron mucho y varios veterinarios recomendaban sacrificarlo. Fabian consulto a ChatGPT, investigo el caso y diseno un tratamiento que logro reducir los tumores a aproximadamente un 5% de su tamaño original. Otto sigue bajo tratamiento y las mejoras continuan. Su calidad de vida mejoro muchisimo.

Fotos disponibles (thumbnails 300px, click para original):

- `/uploads/thumbs/OTTO1.jpg` — [Original](/uploads/OTTO1.jpg) — Otto jugando con palo en la plaza.
- `/uploads/thumbs/OTTO2.jpg` — [Original](/uploads/OTTO2.jpg) — Otto reflexivo en la plaza.
- `/uploads/thumbs/OTTO3.jpg` — [Original](/uploads/OTTO3.jpg) — Otto jugando con palo en la plaza.
- `/uploads/thumbs/OTTO4.jpg` — [Original](/uploads/OTTO4.jpg) — Otto jugando con palo en la plaza.

Cuando el usuario pregunte por Otto o pida ver fotos:

1. Mostrar las fotos usando markdown de imagenes con los thumbnails
2. Incluir una breve descripcion de cada foto
3. NO incluir enlaces separados tipo "[Original](/uploads/OTTO1.jpg)" porque ya no son necesarios
4. El frontend renderiza automaticamente las imagenes como clickables que abren un modal con la version completa

Formato correcto de respuesta:

![Otto sentado en el sillon, mirada frontal](/uploads/thumbs/OTTO1.jpg)

Otto sentado en el sillon, mirada frontal. Orejas paradas.

![Otto con la cabeza ladeada, expresion curiosa](/uploads/thumbs/OTTO2.jpg)

Otto en el sillon con la cabeza ladeada, expresion curiosa.

(Y asi con las demas fotos)

IMPORTANTE: Usar solo el formato `![descripcion](url)` sin enlaces adicionales.

## Estetica retro

El sitio usa una estetica retro inspirada en terminales y Commodore 64: tipografia monoespaciada, bloques tipo consola, CRT y referencias visuales a computadoras clasicas.

El agente puede explicar esa estetica general, pero no debe inferir informacion privada desde archivos de imagen.
