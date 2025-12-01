import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import os

def get_data_transforms(dataset_name, input_size=224):
    
    if dataset_name in ['MNIST', 'FashionMNIST']:
        
        train_transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.Grayscale(num_output_channels=3),  
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        test_transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    else: 
        train_transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomCrop(input_size, padding=4),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        test_transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    return train_transform, test_transform


def load_dataset(dataset_name='CIFAR10', data_dir='./data', batch_size=32, input_size=224):
   
    os.makedirs(data_dir, exist_ok=True)
    
    train_transform, test_transform = get_data_transforms(dataset_name, input_size)
    
    
    if dataset_name == 'MNIST':
        train_dataset = datasets.MNIST(root=data_dir, train=True, 
                                      download=True, transform=train_transform)
        test_dataset = datasets.MNIST(root=data_dir, train=False, 
                                     download=True, transform=test_transform)
        num_classes = 10
        
    elif dataset_name == 'FashionMNIST':
        train_dataset = datasets.FashionMNIST(root=data_dir, train=True, 
                                             download=True, transform=train_transform)
        test_dataset = datasets.FashionMNIST(root=data_dir, train=False, 
                                            download=True, transform=test_transform)
        num_classes = 10
        
    elif dataset_name == 'CIFAR10':
        train_dataset = datasets.CIFAR10(root=data_dir, train=True, 
                                        download=True, transform=train_transform)
        test_dataset = datasets.CIFAR10(root=data_dir, train=False, 
                                       download=True, transform=test_transform)
        num_classes = 10
    
    else:
        raise ValueError(f"Dataset {dataset_name} não suportado")
    
   
    train_loader = DataLoader(train_dataset, batch_size=batch_size, 
                            shuffle=True, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, 
                           shuffle=False, num_workers=2, pin_memory=True)
    
    print(f"\n{'='*60}")
    print(f"Dataset: {dataset_name}")
    print(f"Tamanho treino: {len(train_dataset)}")
    print(f"Tamanho teste: {len(test_dataset)}")
    print(f"Número de classes: {num_classes}")
    print(f"Batch size: {batch_size}")
    print(f"{'='*60}\n")
    
    return train_loader, test_loader, num_classes