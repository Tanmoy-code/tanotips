import argparse
import torch
from datasets import load_dataset
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import evaluate
from PIL import Image
import unicodedata
from tqdm import tqdm
import csv


def normalize_text(s: str) -> str:
    if s is None:
        return ""
    # Normalize unicode and strip whitespace
    return unicodedata.normalize("NFC", s).strip()


def main():
    parser = argparse.ArgumentParser(description="Validate OCR model on a dataset split")
    parser.add_argument("--model_path", type=str, default="./sanskrit_ocr_model", help="Path to saved model/processor")
    parser.add_argument("--dataset", type=str, default="Process-Venue/Sanskrit-OCR-Typed-Dataset", help="Hugging Face dataset id or local path")
    parser.add_argument("--split", type=str, default="validation", help="Which split to evaluate")
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--limit", type=int, default=0, help="If >0, only evaluate on this many samples (for quick checks)")
    parser.add_argument("--max_length", type=int, default=128)
    parser.add_argument("--output_csv", type=str, default="validation_results.csv", help="Optional CSV to save predictions")
    args = parser.parse_args()

    # Check device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load model+processor
    try:
        processor = TrOCRProcessor.from_pretrained(args.model_path)
        model = VisionEncoderDecoderModel.from_pretrained(args.model_path)
        model.to(device)
    except Exception as e:
        print(f"Failed to load model/processor from {args.model_path}: {e}")
        return

    # Load dataset
    print(f"Loading dataset {args.dataset} (split={args.split})...")
    ds = load_dataset(args.dataset, cache_dir="./data")
    if args.split not in ds:
        print(f"Split '{args.split}' not found. Available splits: {list(ds.keys())}")
        return
    split = ds[args.split]

    # Optionally limit
    if args.limit and args.limit > 0:
        n = min(len(split), args.limit)
        split = split.select(range(n))
        print(f"Limiting evaluation to first {n} samples")

    cer_metric = evaluate.load("cer")

    preds = []
    refs = []

    # Process in batches
    for i in tqdm(range(0, len(split), args.batch_size), desc="Evaluating"):
        batch = split[i:i+args.batch_size]

        # Get images and references
        images = []
        batch_refs = []
        for ex in batch:
            # Support different possible key names
            if "image" in ex and ex["image"] is not None:
                img = ex["image"]
            elif "img" in ex and ex["img"] is not None:
                img = ex["img"]
            else:
                # Some dataset rows may only have label text (no image); skip them
                img = None

            if img is None:
                continue

            if hasattr(img, "convert"):
                img = img.convert("RGB")
            images.append(img)

            text = ex.get("label") or ex.get("text") or ex.get("labels")
            batch_refs.append(normalize_text(text))

        if len(images) == 0:
            continue

        # Prepare pixel values
        inputs = processor(images=images, return_tensors="pt").pixel_values
        inputs = inputs.to(device)

        # Generate
        generated_ids = model.generate(inputs, max_length=args.max_length)
        generated_texts = processor.batch_decode(generated_ids, skip_special_tokens=True)

        # Normalize and collect
        for p, r in zip(generated_texts, batch_refs):
            preds.append(normalize_text(p))
            refs.append(r)

    if len(preds) == 0:
        print("No predictions were produced (empty dataset or all examples missing images). Exiting.")
        return

    # Exact-match accuracy
    exact_matches = sum(1 for p, r in zip(preds, refs) if p == r)
    accuracy = exact_matches / len(preds)

    # CER
    cer = cer_metric.compute(predictions=preds, references=refs)

    print("\nValidation results:")
    print(f"  Samples evaluated: {len(preds)}")
    print(f"  Exact-match accuracy: {accuracy:.4f} ({exact_matches}/{len(preds)})")
    print(f"  CER: {cer:.4f}")

    # Save detailed results
    try:
        with open(args.output_csv, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["prediction", "reference"])
            for p, r in zip(preds, refs):
                writer.writerow([p, r])
        print(f"Detailed results saved to {args.output_csv}")
    except Exception as e:
        print(f"Could not save CSV: {e}")


if __name__ == "__main__":
    main()
