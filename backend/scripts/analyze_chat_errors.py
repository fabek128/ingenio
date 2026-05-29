#!/usr/bin/env python3
"""Analiza el log de chat para mostrar errores y problemas del agente.

Uso:
    python scripts/analyze_chat_errors.py [ruta_al_log]

Si no se especifica ruta, lee logs/chat/chat-active.txt
"""

import json
import sys
from collections import Counter
from pathlib import Path


def analyze_log(log_path: Path) -> None:
    """Analiza un archivo de log JSONL y muestra estadisticas de errores."""
    if not log_path.exists():
        print(f"Error: archivo no encontrado: {log_path}")
        sys.exit(1)

    total_interactions = 0
    errors = []
    blocked = []
    empty_responses = []
    output_blocked = []
    successful = []
    event_counts = Counter()

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

            total_interactions += 1
            event = record.get("event", "unknown")
            event_counts[event] += 1

            if event == "model_error":
                errors.append(record)
            elif event == "blocked":
                blocked.append(record)
            elif event == "model_empty_response":
                empty_responses.append(record)
            elif event == "output_blocked":
                output_blocked.append(record)
            elif event == "completed":
                successful.append(record)

    # Resumen
    print(f"\n{'='*70}")
    print(f"RESUMEN DEL LOG: {log_path.name}")
    print(f"{'='*70}\n")
    print(f"Total de interacciones: {total_interactions}")
    print(f"\nDistribucion de eventos:")
    for event, count in event_counts.most_common():
        pct = (count / total_interactions * 100) if total_interactions > 0 else 0
        print(f"  {event:25s}: {count:4d} ({pct:5.1f}%)")

    # Errores del modelo
    if errors:
        print(f"\n{'='*70}")
        print(f"ERRORES DEL MODELO ({len(errors)})")
        print(f"{'='*70}\n")
        for i, record in enumerate(errors[-10:], 1):  # Ultimos 10
            ts = record.get("timestamp", "?")
            error_msg = record.get("error", "sin detalle")
            duration = record.get("duration_ms", 0)
            print(f"{i}. {ts}")
            print(f"   Error: {error_msg}")
            print(f"   Duracion: {duration}ms")
            if "message" in record:
                msg_preview = record["message"][:80]
                print(f"   Mensaje: {msg_preview}...")
            print()

    # Respuestas vacias
    if empty_responses:
        print(f"\n{'='*70}")
        print(f"RESPUESTAS VACIAS ({len(empty_responses)})")
        print(f"{'='*70}\n")
        for i, record in enumerate(empty_responses[-5:], 1):  # Ultimas 5
            ts = record.get("timestamp", "?")
            error_msg = record.get("error", "sin detalle")
            print(f"{i}. {ts}")
            print(f"   Error: {error_msg}")
            if "message" in record:
                msg_preview = record["message"][:80]
                print(f"   Mensaje: {msg_preview}...")
            print()

    # Output bloqueado
    if output_blocked:
        print(f"\n{'='*70}")
        print(f"RESPUESTAS BLOQUEADAS ({len(output_blocked)})")
        print(f"{'='*70}\n")
        reason_counts = Counter(r.get("reason", "unknown") for r in output_blocked)
        print("Por razon:")
        for reason, count in reason_counts.most_common():
            print(f"  {reason:30s}: {count:4d}")
        print()
        for i, record in enumerate(output_blocked[-5:], 1):  # Ultimas 5
            ts = record.get("timestamp", "?")
            reason = record.get("reason", "?")
            error_detail = record.get("error", "")
            print(f"{i}. {ts}")
            print(f"   Razon: {reason}")
            if error_detail:
                print(f"   Detalle: {error_detail[:150]}...")
            print()

    # Prompts bloqueados
    if blocked:
        print(f"\n{'='*70}")
        print(f"PROMPTS BLOQUEADOS ({len(blocked)})")
        print(f"{'='*70}\n")
        reason_counts = Counter(r.get("reason", "unknown") for r in blocked)
        print("Por razon:")
        for reason, count in reason_counts.most_common():
            print(f"  {reason:30s}: {count:4d}")
        print()

    # Estadisticas de exito
    if successful:
        print(f"\n{'='*70}")
        print(f"INTERACCIONES EXITOSAS ({len(successful)})")
        print(f"{'='*70}\n")
        durations = [r.get("duration_ms", 0) for r in successful]
        avg_duration = sum(durations) / len(durations) if durations else 0
        max_duration = max(durations) if durations else 0
        min_duration = min(durations) if durations else 0
        print(f"Duracion promedio: {avg_duration:.0f}ms")
        print(f"Duracion minima: {min_duration}ms")
        print(f"Duracion maxima: {max_duration}ms")

        if "usage" in successful[-1]:
            print(f"\nUltima interaccion exitosa:")
            usage = successful[-1].get("usage", {})
            print(f"  Tokens totales: {usage.get('total_tokens', '?')}")
            print(f"  Tokens prompt: {usage.get('prompt_tokens', '?')}")
            print(f"  Tokens respuesta: {usage.get('completion_tokens', '?')}")

    print(f"\n{'='*70}\n")


def main():
    if len(sys.argv) > 1:
        log_path = Path(sys.argv[1])
    else:
        log_path = Path(__file__).parent.parent / "logs" / "chat" / "chat-active.txt"

    analyze_log(log_path)


if __name__ == "__main__":
    main()
