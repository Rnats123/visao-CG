import torch
import torch.nn as nn
from torchvision import models

def get_model(model_name='resnet18', num_classes=10, pretrained=True):
    
    
    if model_name == 'alexnet':
        model = models.alexnet(weights='IMAGENET1K_V1' if pretrained else None)
        
        num_features = model.classifier[6].in_features
        model.classifier[6] = nn.Linear(num_features, num_classes)
        
    elif model_name == 'resnet18':
        model = models.resnet18(weights='IMAGENET1K_V1' if pretrained else None)
        num_features = model.fc.in_features
        model.fc = nn.Linear(num_features, num_classes)
        
    elif model_name == 'resnet50':
        model = models.resnet50(weights='IMAGENET1K_V1' if pretrained else None)
        num_features = model.fc.in_features
        model.fc = nn.Linear(num_features, num_classes)
        
    elif model_name == 'mobilenet_v2':
        model = models.mobilenet_v2(weights='IMAGENET1K_V1' if pretrained else None)
        num_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_features, num_classes)
        
    else:
        raise ValueError(f"Modelo {model_name} não suportado")
    
    return model


def count_parameters(model):
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    return {
        'total': total_params,
        'trainable': trainable_params,
        'frozen': total_params - trainable_params
    }


def freeze_layers(model, model_name, freeze_until='all'):
    
    if freeze_until == 'none':
      
        for param in model.parameters():
            param.requires_grad = True
            
    elif freeze_until == 'all':
  
        for param in model.parameters():
            param.requires_grad = False
        
       
        if model_name == 'alexnet':
            for param in model.classifier[6].parameters():
                param.requires_grad = True
        elif 'resnet' in model_name:
            for param in model.fc.parameters():
                param.requires_grad = True
        elif 'mobilenet' in model_name:
            for param in model.classifier[1].parameters():
                param.requires_grad = True
                
    elif freeze_until == 'partial':
     
        if model_name == 'alexnet':
        
            for param in model.features.parameters():
                param.requires_grad = False
            for param in model.classifier.parameters():
                param.requires_grad = True
                
        elif 'resnet' in model_name:
        
            for name, param in model.named_parameters():
                if 'layer4' in name or 'fc' in name:
                    param.requires_grad = True
                else:
                    param.requires_grad = False
                    
        elif 'mobilenet' in model_name:
         
            for i, param in enumerate(model.features.parameters()):
                if i < 10:
                    param.requires_grad = False
                else:
                    param.requires_grad = True
            for param in model.classifier.parameters():
                param.requires_grad = True
    
    return model