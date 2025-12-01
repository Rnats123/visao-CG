import torch
import numpy as np
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                            f1_score, confusion_matrix, classification_report)
from tqdm import tqdm
import time
from torchinfo import summary
from ptflops import get_model_complexity_info

def evaluate_model(model, test_loader, device='cuda'):
  
    model.eval()
    model = model.to(device)
    
    all_preds = []
    all_labels = []
    total_time = 0
    
    with torch.no_grad():
        for inputs, labels in tqdm(test_loader, desc='Avaliando'):
            inputs = inputs.to(device)
            
            start_time = time.time()
            outputs = model(inputs)
            inference_time = time.time() - start_time
            total_time += inference_time
            
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
    
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    
    
    metrics = {
        'accuracy': accuracy_score(all_labels, all_preds),
        'precision': precision_score(all_labels, all_preds, average='weighted', zero_division=0),
        'recall': recall_score(all_labels, all_preds, average='weighted', zero_division=0),
        'f1_score': f1_score(all_labels, all_preds, average='weighted', zero_division=0),
        'confusion_matrix': confusion_matrix(all_labels, all_preds),
        'total_inference_time': total_time,
        'avg_inference_time': total_time / len(test_loader.dataset),
        'samples_per_second': len(test_loader.dataset) / total_time
    }
    
   
    metrics['classification_report'] = classification_report(
        all_labels, all_preds, zero_division=0
    )
    
    return metrics


def get_model_complexity(model, input_size=(3, 224, 224), device='cuda'):
  
    model = model.to(device)
    
    
    model_stats = summary(model, input_size=(1, *input_size), 
                         verbose=0, device=device)
    
  
    try:
        macs, params = get_model_complexity_info(
            model, input_size, as_strings=False,
            print_per_layer_stat=False, verbose=False
        )
        flops = 2 * macs  
    except:
        flops = None
        macs = None
    
    complexity = {
        'total_params': model_stats.total_params,
        'trainable_params': model_stats.trainable_params,
        'model_size_mb': model_stats.total_params * 4 / (1024 ** 2),  # Float32
        'flops': flops,
        'macs': macs
    }
    
    return complexity


def print_metrics(metrics, model_name, dataset_name):
    """Imprime métricas formatadas"""
    print(f"\n{'='*70}")
    print(f"RESULTADOS: {model_name} - {dataset_name}")
    print(f"{'='*70}")
    
    print(f"\n Métricas de Classificação:")
    print(f"  Acurácia:  {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
    print(f"  Precisão:  {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1-Score:  {metrics['f1_score']:.4f}")
    
    print(f"\n Desempenho de Inferência:")
    print(f"  Tempo total:           {metrics['total_inference_time']:.4f}s")
    print(f"  Tempo médio/imagem:    {metrics['avg_inference_time']*1000:.2f}ms")
    print(f"  Imagens por segundo:   {metrics['samples_per_second']:.2f}")
    
    if 'total_params' in metrics:
        print(f"\n Complexidade do Modelo:")
        print(f"  Parâmetros totais:     {metrics['total_params']:,}")
        print(f"  Parâmetros treináveis: {metrics['trainable_params']:,}")
        print(f"  Tamanho do modelo:     {metrics['model_size_mb']:.2f} MB")
        if metrics.get('flops'):
            print(f"  FLOPs:                 {metrics['flops']/1e9:.2f} GFLOPs")
    
    print(f"\n Relatório de Classificação:")
    print(metrics['classification_report'])
    print(f"{'='*70}\n")


def compare_models(results_dict):
    
    print(f"\n{'='*80}")
    print("COMPARAÇÃO DE MODELOS")
    print(f"{'='*80}\n")
    
    print(f"{'Modelo':<20} {'Acurácia':<12} {'F1-Score':<12} {'Tempo/img':<15} {'Params':<15}")
    print(f"{'-'*80}")
    
    for model_name, metrics in results_dict.items():
        acc = f"{metrics['accuracy']:.4f}"
        f1 = f"{metrics['f1_score']:.4f}"
        time_per_img = f"{metrics['avg_inference_time']*1000:.2f}ms"
        params = f"{metrics.get('total_params', 0)/1e6:.2f}M"
        
        print(f"{model_name:<20} {acc:<12} {f1:<12} {time_per_img:<15} {params:<15}")
    
    print(f"{'-'*80}\n")