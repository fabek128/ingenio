#!/usr/bin/env python3
"""Analiza respuestas vacías del modelo para debugging.

Uso:
    python scripts/debug_empty_responses.py [ruta_al_log]
"""

import json
import sys
from pathlib import Path


def analyze_empty_responses(log_path: Path) -> None:
    """Analiza eventos de model_empty_response para entender qué está fallando."""
    if not log_path.exists():
        print(f"Error: archivo no encontrado: {log_path}")
        sys.exit(1)

    empty_responses = []

    with log_path.open("r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                record = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"Linea {line_num}: Error parseando JSON: {e}")
                continue

            if record.get("event") == "model_empty_response":
                empty_responses.append(record)

    if not empty_responses:
        print("No se encontraron eventos de model_empty_response en el log.")
        return

    print(f"\n{'='*70}")
    print(f"RESPUESTAS VACIAS DETECTADAS: {len(empty_responses)}")
    print(f"{'='*70}\n")

    for i, record in enumerate(empty_responses, 1):
        print(f"\n{'-'*70}")
        print(f"Evento #{i}")
        print(f"{'-'*70}")

        ts = record.get("timestamp", "?")
        msg = record.get("message", "")
        error = record.get("error", "sin detalle")
        usage = record.get("usage", {})

        print(f"Timestamp: {ts}")
        print(f"Mensaje: {msg}")
        print(f"\nUso de tokens:")
        print(f"  Total: {usage.get('total_tokens', '?')}")
        print(f"  Prompt: {usage.get('prompt_tokens', '?')}")
        print(f"  Completion: {usage.get('completion_tokens', '?')}")

        if usage.get("completion_tokens", 0) > 0:
            print(f"\n⚠️  IMPORTANTE: El modelo generó {usage['completion_tokens']} tokens")
            print("   pero el texto no pudo ser extraído. Esto sugiere:")
            print("   1. El formato de respuesta es diferente al esperado")
            print("   2. El contenido está en un campo no soportado")
            print("   3. El modelo está generando contenido no-texto (tool calls, etc)")

        print(f"\nError registrado:")
        print(f"  {error}")

        if "Raw preview" in error:
            print("\n📋 Preview de la respuesta raw:")
            # Extraer el preview del error
            try:
                preview_start = error.index("Raw preview: ") + len("Raw preview: ")
                preview = error[preview_start:]
                print(f"  {preview}")
            except ValueError:
                pass

        print()

    print(f"\n{'='*70}")
    print("RECOMENDACIONES")
    print(f"{'='*70}\n")

    total_completion_tokens = sum(
        r.get("usage", {}).get("completion_tokens", 0)
        for r in empty_responses
    )

    if total_completion_tokens > 0:
        print("1. El modelo SÍ está generando contenido (completion_tokens > 0)")
        print("   pero la función de extracción no lo encuentra.")
        print()
        print("2. Acciones recomendadas:")
        print("   a) Reiniciar el backend para aplicar las mejoras de extracción")
        print("   b) Revisar logs de uvicorn para ver el mensaje WARNING completo")
        print("   c) Si persiste, contactar soporte de OpenCode Zen API")
        print()
        print("3. Para ver el mensaje WARNING completo en uvicorn:")
        print("   - Buscar 'model_empty_response: extraction failed' en los logs")
        print("   - El log incluye los primeros 1000 chars de la respuesta completa")
        print()
    else:
        print("1. El modelo NO está generando contenido (completion_tokens = 0)")
        print("   Esto sugiere un problema con el prompt o el modelo.")
        print()
        print("2. Acciones recomendadas:")
        print("   a) Verificar el contenido del prompt")
        print("   b) Verificar límites de tokens en la configuración")
        print("   c) Intentar con otro modelo si está disponible")
        print()

    print("4. Para debugging adicional:")
    print("   - Ver logs completos: journalctl -u ingenio-api -f")
    print("   - Inspeccionar contexto: cat backend/knowledge/public/*.md")
    print()


def main():
    if len(sys.argv) > 1:
        log_path = Path(sys.argv[1])
    else:
        log_path = Path(__file__).parent.parent / "logs" / "chat" / "chat-active.txt"

    analyze_empty_responses(log_path)


if __name__ == "__main__":
    main()
