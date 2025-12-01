import torch
import torch.nn as nn
import os
import argparse
from src.data_loader import load_dataset
from src.models import get_model, freeze_layers, count_parameters
from src.train import train_model, get_optimizer, get_scheduler
from src.evaluate import evaluate_model, get_model_complexity, print_metrics, compare_models
from src.visualize import (plot_training_history, plot_confusion_matrix, 
                          plot_metrics_comparison, plot_efficiency_comparison,
                          save_results_to_csv)

def main(args):
   
    
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\n  Usando device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}\n")
    
    
    os.makedirs('models/checkpoints', exist_ok=True)
    os.makedirs('models/best_models', exist_ok=True)
    
    
    print("\n Carregando dataset...")
    train_loader, test_loader, num_classes = load_dataset(
        dataset_name=args.dataset,
        data_dir=args.data_dir,
        batch_size=args.batch_size,
        input_size=args.input_size
    )
    
    
    class_names = {
        'CIFAR10': ['airplane', 'automobile', 'bird', 'cat', 'deer', 
                   'dog', 'frog', 'horse', 'ship', 'truck'],
        'MNIST': [str(i) for i in range(10)],
        'FashionMNIST': ['T-shirt', 'Trouser', 'Pullover', 'Dress', 'Coat',
                        'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']
    }
    
    
    models_to_train = args.models.split(',')
    
    all_results = {}
    
    for model_name in models_to_train:
        print(f"\n{'='*70}")
        print(f" INICIANDO TREINAMENTO: {model_name.upper()}")
        print(f"{'='*70}\n")
        
        
        print(f"Criando modelo {model_name}...")
        model = get_model(model_name, num_classes=num_classes, pretrained=True)
        
     
        if args.freeze_layers != 'none':
            print(f"Congelando camadas: {args.freeze_layers}")
            model = freeze_layers(model, model_name, args.freeze_layers)
        
      
        params_info = count_parameters(model)
        print(f"\nParâmetros totais: {params_info['total']:,}")
        print(f"Parâmetros treináveis: {params_info['trainable']:,}")
        print(f"Parâmetros congelados: {params_info['frozen']:,}")
        
        
        criterion = nn.CrossEntropyLoss()
        optimizer = get_optimizer(model, args.optimizer, args.learning_rate)
        scheduler = get_scheduler(optimizer, args.scheduler) if args.use_scheduler else None
        
        
        print(f"\n  Iniciando treinamento...")
        trained_model, history = train_model(
            model=model,
            train_loader=train_loader,
            test_loader=test_loader,
            criterion=criterion,
            optimizer=optimizer,
            scheduler=scheduler,
            num_epochs=args.num_epochs,
            device=device
        )
        
      
        model_path = f'models/best_models/{model_name}_{args.dataset}.pth'
        torch.save(trained_model.state_dict(), model_path)
        print(f"✓ Modelo salvo em: {model_path}")
        
        
        plot_training_history(history, f"{model_name}_{args.dataset}")
        
       
        print(f"\n Avaliando modelo {model_name}...")
        metrics = evaluate_model(trained_model, test_loader, device)
        
       
        complexity = get_model_complexity(trained_model, 
                                         input_size=(3, args.input_size, args.input_size),
                                         device=device)
        metrics.update(complexity)
        
        
        print_metrics(metrics, model_name, args.dataset)
        
       
        plot_confusion_matrix(metrics['confusion_matrix'], 
                            class_names[args.dataset],
                            f"{model_name}_{args.dataset}")
        
       
        all_results[model_name] = metrics
    
    
    if len(all_results) > 1:
        print("\n" + "="*80)
        print(" COMPARAÇÃO FINAL DE TODOS OS MODELOS")
        print("="*80)
        compare_models(all_results)
        
        
        plot_metrics_comparison(all_results)
        plot_efficiency_comparison(all_results)
        
       
        save_results_to_csv(all_results, args.dataset)
    
    print(f"\n Processo finalizado!")
    print(f" Resultados salvos em: ./results/")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Comparação de CNNs pré-treinadas')
    
  
    parser.add_argument('--dataset', type=str, default='CIFAR10',
                       choices=['MNIST', 'CIFAR10', 'FashionMNIST'],
                       help='Dataset a ser utilizado')
    parser.add_argument('--data_dir', type=str, default='./data',
                       help='Diretório para salvar os dados')
    parser.add_argument('--batch_size', type=int, default=32,
                       help='Tamanho do batch')
    parser.add_argument('--input_size', type=int, default=224,
                       help='Tamanho da imagem de entrada')
    
    
    parser.add_argument('--models', type=str, default='resnet18,mobilenet_v2',
                       help='Modelos separados por vírgula (alexnet,resnet18,resnet50,mobilenet_v2)')
    parser.add_argument('--freeze_layers', type=str, default='partial',
                       choices=['none', 'all', 'partial'],
                       help='Estratégia de congelamento de camadas')
    
  
    parser.add_argument('--num_epochs', type=int, default=10,
                       help='Número de épocas')
    parser.add_argument('--learning_rate', type=float, default=0.001,
                       help='Learning rate')
    parser.add_argument('--optimizer', type=str, default='adam',
                       choices=['adam', 'sgd'],
                       help='Otimizador')
    parser.add_argument('--use_scheduler', action='store_true',
                       help='Usar learning rate scheduler')
    parser.add_argument('--scheduler', type=str, default='step',
                       choices=['step', 'cosine'],
                       help='Tipo de scheduler')
    
    args = parser.parse_args()
    main(args)