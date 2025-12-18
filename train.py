import torch
from datasets import load_dataset
from transformers import (
    VisionEncoderDecoderModel,
    TrOCRProcessor,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    default_data_collator,
)
import evaluate
import numpy as np

def train_model():
    """
    This function handles the entire model training and evaluation process.
    """
    # 1. Load dataset
    print("Loading dataset...")
    dataset = load_dataset("Process-Venue/Sanskrit-OCR-Typed-Dataset", cache_dir="./data")
    train_dataset = dataset["train"]
    eval_dataset = dataset["validation"]
    
    print(f"Dataset loaded. Training samples: {len(train_dataset)}, Evaluation samples: {len(eval_dataset)}")
    print("Sample data point:", train_dataset[0])

    # 2. Initialize process
    print("Initializing TrOCR processor...")
    processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-stage1")
    
    # 3. Define the data transformation function
    
    def preprocess_batch(examples):
        images = examples.get("image") or examples.get("img") or examples.get("pixels")
        if images is None:
            raise KeyError(f"No image field found in batch. Keys: {list(examples.keys())}")

        imgs = [img.convert("RGB") if hasattr(img, "convert") else img for img in images]
        pixel_values = processor(images=imgs, return_tensors="pt").pixel_values

        texts = examples.get("label") or examples.get("text") or examples.get("labels")
        if texts is None:
            raise KeyError(f"No text/label field found in batch. Keys: {list(examples.keys())}")

        tokenized = processor.tokenizer(texts, padding="max_length", max_length=128, truncation=True)
        labels = tokenized.input_ids
        labels = [[(l if l != processor.tokenizer.pad_token_id else -100) for l in seq] for seq in labels]

        return {"pixel_values": pixel_values, "labels": labels}

    print("Preprocessing datasets (this may take a few minutes)...")

    remove_cols = [c for c in train_dataset.column_names if c not in ("image", "label")]
    train_dataset = train_dataset.map(preprocess_batch, batched=True, batch_size=32, remove_columns=remove_cols)
    eval_dataset = eval_dataset.map(preprocess_batch, batched=True, batch_size=32, remove_columns=remove_cols)

    # Set PyTorch format 
    train_dataset.set_format(type="torch", columns=["pixel_values", "labels"])
    eval_dataset.set_format(type="torch", columns=["pixel_values", "labels"])

    # 4. Initialize model
    print("Initializing VisionEncoderDecoderModel...")
    model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-stage1")
    model.config.decoder_start_token_id = processor.tokenizer.cls_token_id
    model.config.pad_token_id = processor.tokenizer.pad_token_id
    model.config.vocab_size = model.config.decoder.vocab_size

    # 5. Define evaluation metric
    cer_metric = evaluate.load("cer")

    def compute_metrics(pred):
        pred_ids = pred.predictions
        if isinstance(pred_ids, tuple):
            pred_ids = pred_ids[0]

        labels = pred.label_ids
        labels = np.where(labels == -100, processor.tokenizer.pad_token_id, labels)

        pred_str = processor.batch_decode(pred_ids, skip_special_tokens=True)
        label_str = processor.batch_decode(labels, skip_special_tokens=True)

        cer = cer_metric.compute(predictions=pred_str, references=label_str)
        return {"cer": cer}

    # 6. Define training arguments
    training_args = Seq2SeqTrainingArguments(
        output_dir="./sanskrit_ocr_model",
        predict_with_generate=True,
        eval_strategy="steps",
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        fp16=torch.cuda.is_available(),
        learning_rate=5e-5,
        num_train_epochs=10,
        logging_steps=100,
        eval_steps=1000,
        save_steps=1000,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="cer",
        greater_is_better=False,
    )

    # 7. Initialize the Trainer
    trainer = Seq2SeqTrainer(
        model=model,
        tokenizer=processor.tokenizer,
        args=training_args,
        compute_metrics=compute_metrics,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=default_data_collator,
    )

    # 8. Start training
    print("\n--- Starting Model Training ---")
    trainer.train()
    print("--- Training Finished ---\n")

    # 9. Save the final model and processor
    print("Saving the final model and processor...")
    trainer.save_model("./sanskrit_ocr_model")
    processor.save_pretrained("./sanskrit_ocr_model")
    print("Model saved successfully in the 'sanskrit_ocr_model' directory.")

if __name__ == "__main__":
    train_model()