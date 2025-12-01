import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
import time
import copy

def train_model(model, train_loader, test_loader, criterion, optimizer, 
                scheduler=None, num_epochs=10, device='cuda'):
    
    model = model.to(device)
    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0
    
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': [],
        'epoch_time': []
    }
    
    for epoch in range(num_epochs):
        epoch_start = time.time()
        print(f'\nÉpoca {epoch+1}/{num_epochs}')
        print('-' * 60)
        
       
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        train_bar = tqdm(train_loader, desc='Treinando')
        for inputs, labels in train_bar:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            
            train_bar.set_postfix({'loss': f'{loss.item():.4f}'})
        
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = running_corrects.double() / len(train_loader.dataset)
        
        history['train_loss'].append(epoch_loss)
        history['train_acc'].append(epoch_acc.item())
        
     
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        
        with torch.no_grad():
            val_bar = tqdm(test_loader, desc='Validando')
            for inputs, labels in val_bar:
                inputs = inputs.to(device)
                labels = labels.to(device)
                
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)
                
                val_bar.set_postfix({'loss': f'{loss.item():.4f}'})
        
        val_loss = val_loss / len(test_loader.dataset)
        val_acc = val_corrects.double() / len(test_loader.dataset)
        
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc.item())
        
        epoch_time = time.time() - epoch_start
        history['epoch_time'].append(epoch_time)
        
        print(f'\nTrain Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')
        print(f'Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}')
        print(f'Tempo: {epoch_time:.2f}s')
        
        
        if val_acc > best_acc:
            best_acc = val_acc
            best_model_wts = copy.deepcopy(model.state_dict())
            print(f'✓ Novo melhor modelo! Val Acc: {val_acc:.4f}')
        
       
        if scheduler is not None:
            scheduler.step()
    
    print(f'\n{"="*60}')
    print(f'Melhor acurácia de validação: {best_acc:.4f}')
    print(f'{"="*60}\n')
    
    
    model.load_state_dict(best_model_wts)
    
    return model, history


def get_optimizer(model, optimizer_name='adam', lr=0.001, momentum=0.9):
    
    if optimizer_name.lower() == 'adam':
        return optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), 
                         lr=lr)
    elif optimizer_name.lower() == 'sgd':
        return optim.SGD(filter(lambda p: p.requires_grad, model.parameters()), 
                        lr=lr, momentum=momentum)
    else:
        raise ValueError(f"Otimizador {optimizer_name} não suportado")


def get_scheduler(optimizer, scheduler_name='step', step_size=7, gamma=0.1):
    
    if scheduler_name.lower() == 'step':
        return optim.lr_scheduler.StepLR(optimizer, step_size=step_size, gamma=gamma)
    elif scheduler_name.lower() == 'cosine':
        return optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=10)
    else:
        return None