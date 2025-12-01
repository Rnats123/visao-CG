#!pip install torch torchvision matplotlib pillow numpy -q

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, models
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np
from google.colab import files
import copy
import warnings
warnings.filterwarnings('ignore')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.set_default_dtype(torch.float32)
print(f"Usando dispositivo: {device}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

class Config:
    imsize = 512 if torch.cuda.is_available() else 256
    
    style_weight = 100000
    content_weight = 1
    
    num_steps = 300
    
    content_layers = ['21'] 
    style_layers = ['0', '5', '10', '19', '28']

config = Config()
print(f"Tamanho das imagens: {config.imsize}x{config.imsize}")
print(f"Peso do estilo: {config.style_weight}")
print(f"Peso do conteúdo: {config.content_weight}")

def load_image(image_path, imsize):
    """Carrega e processa uma imagem"""
    image = Image.open(image_path).convert('RGB')
    
    loader = transforms.Compose([
        transforms.Resize((imsize, imsize)),
        transforms.ToTensor()
    ])
    
    image = loader(image).unsqueeze(0)
    return image.to(device, torch.float)

def tensor_to_image(tensor):
    """Converte tensor para imagem numpy"""
    image = tensor.cpu().clone().detach()
    image = image.squeeze(0)
    image = image.permute(1, 2, 0)
    image = image.numpy()
    image = np.clip(image, 0, 1)
    return image

def imshow(tensor, title=None):
    """Exibe um tensor como imagem"""
    image = tensor_to_image(tensor)
    plt.imshow(image)
    if title:
        plt.title(title, fontsize=12, fontweight='bold')
    plt.axis('off')


class ContentLoss(nn.Module):
    def __init__(self, target):
        super(ContentLoss, self).__init__()
        self.target = target.detach()

    def forward(self, input):
        self.loss = nn.functional.mse_loss(input, self.target)
        return input

def gram_matrix(input):
    """Calcula a matriz de Gram"""
    batch, channels, height, width = input.size()
    features = input.view(batch * channels, height * width)
    G = torch.mm(features, features.t())
    return G.div(batch * channels * height * width)

class StyleLoss(nn.Module):
    def __init__(self, target_feature):
        super(StyleLoss, self).__init__()
        self.target = gram_matrix(target_feature).detach()

    def forward(self, input):
        G = gram_matrix(input)
        self.loss = nn.functional.mse_loss(G, self.target)
        return input

cnn_normalization_mean = torch.tensor([0.485, 0.456, 0.406]).to(device)
cnn_normalization_std = torch.tensor([0.229, 0.224, 0.225]).to(device)

class Normalization(nn.Module):
    def __init__(self, mean, std):
        super(Normalization, self).__init__()
        self.mean = mean.view(-1, 1, 1)
        self.std = std.view(-1, 1, 1)

    def forward(self, img):
        return (img - self.mean) / self.std

def get_style_model_and_losses(cnn, style_img, content_img, 
                                content_layers, style_layers):
    """Constrói o modelo com camadas de perda - VERSÃO CORRIGIDA"""
    
    normalization = Normalization(cnn_normalization_mean, cnn_normalization_std).to(device)
    
    content_losses = []
    style_losses = []
    
    model = nn.Sequential(normalization)
    
    i = 0
    for layer in cnn.children():
        if isinstance(layer, nn.Conv2d):
            name = f'conv_{i}'
        elif isinstance(layer, nn.ReLU):
            name = f'relu_{i}'
            layer = nn.ReLU(inplace=False)
        elif isinstance(layer, nn.MaxPool2d):
            name = f'pool_{i}'
        elif isinstance(layer, nn.BatchNorm2d):
            name = f'bn_{i}'
        else:
            continue
            
        model.add_module(name, layer)
        
        if str(i) in content_layers:
            target = model(content_img).detach()
            content_loss = ContentLoss(target)
            model.add_module(f"content_loss_{i}", content_loss)
            content_losses.append(content_loss)
            print(f"Adicionada perda de conteúdo na camada {i}")
        
        if str(i) in style_layers:
            target_feature = model(style_img).detach()
            style_loss = StyleLoss(target_feature)
            model.add_module(f"style_loss_{i}", style_loss)
            style_losses.append(style_loss)
            print(f"Adicionada perda de estilo na camada {i}")
        
        i += 1
    
    print(f"\Resumo:")
    print(f"Perdas de conteúdo: {len(content_losses)}")
    print(f"Perdas de estilo: {len(style_losses)}")
    
    if len(content_losses) == 0:
        print("AVISO: Nenhuma perda de conteúdo foi adicionada!")
        print(f"Camadas de conteúdo configuradas: {content_layers}")
        print(f"Total de camadas processadas: {i}")
    
    if len(style_losses) == 0:
        print("AVISO: Nenhuma perda de estilo foi adicionada!")
        print(f"Camadas de estilo configuradas: {style_layers}")
    
    return model, style_losses, content_losses

def run_style_transfer(cnn, content_img, style_img, input_img, 
                       num_steps=300, style_weight=100000, content_weight=1):
    """Executa o transfer de estilo"""
    print('🔧 Construindo o modelo de style transfer...')
    
    model, style_losses, content_losses = get_style_model_and_losses(
        cnn, style_img, content_img, config.content_layers, config.style_layers)
    
    if len(style_losses) == 0:
        raise ValueError(f"""
        Nenhuma camada de estilo encontrada! 
        Camadas configuradas: {config.style_layers}
        Verifique se os índices correspondem às camadas da VGG-19
        """)
    if len(content_losses) == 0:
        raise ValueError(f"""
        Nenhuma camada de conteúdo encontrada!
        Camadas configuradas: {config.content_layers}
        Verifique se os índices correspondem às camadas da VGG-19
        """)
    
    input_img.requires_grad_(True)
    optimizer = optim.Adam([input_img], lr=0.003)
    
    model.eval()
    model.requires_grad_(False)
    
    print('Otimizando...')
    print('-' * 60)
    
    for run in range(num_steps):
        with torch.no_grad():
            input_img.clamp_(0, 1)
        
        optimizer.zero_grad()
        model(input_img)
        
        style_score = torch.tensor(0.0, device=device)
        content_score = torch.tensor(0.0, device=device)
        
        for sl in style_losses:
            style_score += sl.loss
        for cl in content_losses:
            content_score += cl.loss
        
        style_score *= style_weight
        content_score *= content_weight
        
        loss = style_score + content_score
        loss.backward()
        optimizer.step()
        
        if run % 50 == 0 or run == num_steps - 1:
            print(f"Iteração {run:3d} | "
                  f"Estilo: {style_score.item():12.2f} | "
                  f"Conteúdo: {content_score.item():8.2f} | "
                  f"Total: {loss.item():12.2f}")
    
    with torch.no_grad():
        input_img.clamp_(0, 1)
    
    print('-' * 60)
    print('Otimização concluída!')
    
    return input_img


print("\n" + "="*60)
print("NEURAL STYLE TRANSFER - Versão Corrigida!")
print("="*60)

print("\nFaça upload da imagem de CONTEÚDO:")
uploaded_content = files.upload()
content_path = list(uploaded_content.keys())[0]

print("\nFaça upload da imagem de ESTILO:")
uploaded_style = files.upload()
style_path = list(uploaded_style.keys())[0]

content_img = load_image(content_path, config.imsize)
style_img = load_image(style_path, config.imsize)

print(f"\n Imagens carregadas com sucesso!")
print(f"📐 Tamanho: {config.imsize}x{config.imsize}")

plt.figure(figsize=(14, 5))
plt.subplot(1, 2, 1)
imshow(content_img, title='Imagem de Conteúdo')
plt.subplot(1, 2, 2)
imshow(style_img, title='Imagem de Estilo')
plt.tight_layout()
plt.show()


print("\n" + "="*60)
print("INICIANDO STYLE TRANSFER")
print("="*60)


cnn = models.vgg19(pretrained=True).features.to(device).eval()
print("VGG-19 carregada")

input_img = content_img.clone()

try:
    output = run_style_transfer(
        cnn, content_img, style_img, input_img, 
        num_steps=config.num_steps,
        style_weight=config.style_weight,
        content_weight=config.content_weight
    )

    print("\Gerando visualização...")

    plt.figure(figsize=(18, 6))

    plt.subplot(1, 3, 1)
    imshow(content_img, title='Conteúdo Original')

    plt.subplot(1, 3, 2)
    imshow(style_img, title='Estilo Artístico')

    plt.subplot(1, 3, 3)
    imshow(output, title='Resultado Final')

    plt.tight_layout()
    plt.savefig('resultado_nst.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.show()

    print("\n" + "="*60)
    print("TRANSFERÊNCIA CONCLUÍDA!")
    print("="*60)
    print(f"Imagem salva: resultado_nst.png")

except Exception as e:
    print(f"\n Erro durante o processamento: {e}")
    print("\n Solução de problemas:")
    print("1. Verifique se as imagens foram carregadas corretamente")
    print("2. Tente reduzir o tamanho das imagens")
    print("3. Verifique se há memória GPU suficiente")