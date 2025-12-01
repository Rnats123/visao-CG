import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import os

def plot_training_history(history, model_name, save_dir='results/plots'):
    
    os.makedirs(save_dir, exist_ok=True)
    
    fig, axes = plt.subplots(1, 2, figsize=(15, 5))
    
    
    axes[0].plot(history['train_loss'], label='Train Loss', marker='o')
    axes[0].plot(history['val_loss'], label='Val Loss', marker='s')
    axes[0].set_xlabel('Época')
    axes[0].set_ylabel('Loss')
    axes[0].set_title(f'{model_name} - Loss')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    
    axes[1].plot(history['train_acc'], label='Train Acc', marker='o')
    axes[1].plot(history['val_acc'], label='Val Acc', marker='s')
    axes[1].set_xlabel('Época')
    axes[1].set_ylabel('Acurácia')
    axes[1].set_title(f'{model_name} - Acurácia')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(f'{save_dir}/{model_name}_training_history.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Gráfico salvo em: {save_dir}/{model_name}_training_history.png")


def plot_confusion_matrix(cm, class_names, model_name, save_dir='results/confusion_matrices'):
    
    os.makedirs(save_dir, exist_ok=True)
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=class_names, yticklabels=class_names)
    plt.title(f'Matriz de Confusão - {model_name}')
    plt.ylabel('Classe Real')
    plt.xlabel('Classe Predita')
    plt.tight_layout()
    plt.savefig(f'{save_dir}/{model_name}_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Matriz de confusão salva em: {save_dir}/{model_name}_confusion_matrix.png")


def plot_metrics_comparison(results_dict, save_dir='results/plots'):
    
    os.makedirs(save_dir, exist_ok=True)
    
    models = list(results_dict.keys())
    metrics_names = ['accuracy', 'precision', 'recall', 'f1_score']
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    axes = axes.ravel()
    
    for idx, metric in enumerate(metrics_names):
        values = [results_dict[model][metric] for model in models]
        
        bars = axes[idx].bar(models, values, alpha=0.7, 
                            color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'][:len(models)])
        axes[idx].set_ylabel(metric.capitalize())
        axes[idx].set_title(f'Comparação - {metric.upper()}')
        axes[idx].set_ylim([0, 1.1])
        axes[idx].grid(True, alpha=0.3, axis='y')
        
        
        for bar in bars:
            height = bar.get_height()
            axes[idx].text(bar.get_x() + bar.get_width()/2., height,
                          f'{height:.4f}',
                          ha='center', va='bottom', fontsize=10)
        
       
        axes[idx].tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig(f'{save_dir}/metrics_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Comparação de métricas salva em: {save_dir}/metrics_comparison.png")


def plot_efficiency_comparison(results_dict, save_dir='results/plots'):
    
    os.makedirs(save_dir, exist_ok=True)
    
    models = list(results_dict.keys())
    
    
    inference_times = [results_dict[m]['avg_inference_time'] * 1000 for m in models]  # ms
    params = [results_dict[m].get('total_params', 0) / 1e6 for m in models]  # Milhões
    accuracies = [results_dict[m]['accuracy'] * 100 for m in models]  # Percentual
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    
    bars1 = axes[0].bar(models, inference_times, alpha=0.7, color='skyblue')
    axes[0].set_ylabel('Tempo (ms)')
    axes[0].set_title('Tempo Médio de Inferência por Imagem')
    axes[0].grid(True, alpha=0.3, axis='y')
    axes[0].tick_params(axis='x', rotation=45)
    for bar in bars1:
        height = bar.get_height()
        axes[0].text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.2f}ms', ha='center', va='bottom')
    
   
    bars2 = axes[1].bar(models, params, alpha=0.7, color='lightcoral')
    axes[1].set_ylabel('Parâmetros (Milhões)')
    axes[1].set_title('Número de Parâmetros')
    axes[1].grid(True, alpha=0.3, axis='y')
    axes[1].tick_params(axis='x', rotation=45)
    for bar in bars2:
        height = bar.get_height()
        axes[1].text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.2f}M', ha='center', va='bottom')
    
    
    scatter = axes[2].scatter(inference_times, accuracies, s=np.array(params)*50, 
                             alpha=0.6, c=range(len(models)), cmap='viridis')
    axes[2].set_xlabel('Tempo de Inferência (ms)')
    axes[2].set_ylabel('Acurácia (%)')
    axes[2].set_title('Acurácia vs Eficiência\n(Tamanho da bolha = Parâmetros)')
    axes[2].grid(True, alpha=0.3)
    
    for i, model in enumerate(models):
        axes[2].annotate(model, (inference_times[i], accuracies[i]),
                        xytext=(5, 5), textcoords='offset points', fontsize=9)
    
    plt.tight_layout()
    plt.savefig(f'{save_dir}/efficiency_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f" Comparação de eficiência salva em: {save_dir}/efficiency_comparison.png")


def save_results_to_csv(results_dict, dataset_name, save_dir='results/metrics'):
   
    os.makedirs(save_dir, exist_ok=True)
    
    data = []
    for model_name, metrics in results_dict.items():
        row = {
            'Model': model_name,
            'Dataset': dataset_name,
            'Accuracy': metrics['accuracy'],
            'Precision': metrics['precision'],
            'Recall': metrics['recall'],
            'F1-Score': metrics['f1_score'],
            'Avg_Inference_Time_ms': metrics['avg_inference_time'] * 1000,
            'Samples_Per_Second': metrics['samples_per_second'],
            'Total_Params': metrics.get('total_params', 0),
            'Trainable_Params': metrics.get('trainable_params', 0),
            'Model_Size_MB': metrics.get('model_size_mb', 0)
        }
        data.append(row)
    
    df = pd.DataFrame(data)
    filepath = f'{save_dir}/{dataset_name}_results.csv'
    df.to_csv(filepath, index=False)
    print(f"✓ Resultados salvos em: {filepath}")
    
    return df