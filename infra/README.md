# Moon Phases Infrastructure as Code (Terraform)

Esta carpeta contiene la configuración de Terraform para desplegar la infraestructura de Moon Phases en AWS.

## 📋 Requisitos

- Terraform >= 1.0
- AWS CLI v2
- Credenciales de AWS configuradas (`aws configure`)
- Cuenta de AWS con permisos suficientes

## 🗂️ Estructura de archivos

```
infra/
├── main.tf                 # Configuración del provider AWS
├── variables.tf            # Definición de variables
├── terraform.tfvars        # Valores de variables para staging
├── ec2.tf                  # Configuración de instancia EC2
├── ecr.tf                  # Repositorios ECR para Docker
├── security_group.tf       # Reglas de seguridad
├── iam.tf                  # Roles y políticas IAM
├── outputs.tf              # Valores de salida
└── user_data.sh           # Script de inicialización para EC2
```

## 🚀 Despliegue

### 1. Inicializar Terraform

```bash
cd infra/
terraform init
```

### 2. Validar la configuración

```bash
terraform validate
```

### 3. Planificar el despliegue

```bash
terraform plan -out=tfplan
```

### 4. Aplicar la configuración

```bash
terraform apply tfplan
```

### 5. Obtener información de salida

```bash
terraform output
# o ver detalles completos:
terraform output deployment_info
```

## 📝 Variables principales

Edita `terraform.tfvars` para personalizar:

| Variable | Descripción | Valor por defecto |
|----------|-------------|------------------|
| `aws_region` | Región de AWS | `us-east-1` |
| `environment` | Entorno (staging/production) | `staging` |
| `instance_type` | Tipo de instancia EC2 | `t3.medium` |
| `instance_volume_size` | Tamaño del volumen (GB) | `30` |
| `allowed_ssh_cidrs` | CIDRs permitidos para SSH | `["0.0.0.0/0"]` |

## 🔑 Políticas de IAM

Los usuarios de GitHub Actions necesitan las siguientes políticas:

- ✅ ECR: push/pull de imágenes
- ✅ EC2: acceso SSH a instancias (Instance Connect)
- ✅ CloudWatch Logs: escribir logs

Ver `../docs/iam-policies.md` para las políticas completas.

## 🔐 Seguridad

### Modificaciones recomendadas:

1. **Restringir SSH**: En `terraform.tfvars`, cambiar:
   ```hcl
   allowed_ssh_cidrs = ["YOUR_IP/32"]  # Solo tu IP o GitHub Actions
   ```

2. **Backend remoto**: En `main.tf`, descomentar el backend S3:
   ```hcl
   backend "s3" {
     bucket         = "tu-bucket-de-estado"
     key            = "staging/terraform.tfstate"
     region         = "us-east-1"
   }
   ```

3. **Encriptación de volúmenes**: Ya está habilitada por defecto.

## 📊 Outputs disponibles

Después del despliegue, obtén:

```bash
terraform output ec2_public_ip          # IP pública de EC2
terraform output backend_ecr_repository_url
terraform output frontend_ecr_repository_url
terraform output deployment_info        # Resumen completo
```

## ❌ Destruir infraestructura

⚠️ **Esto eliminará todos los recursos:**

```bash
terraform destroy
```

## 🔄 Actualizar configuración

1. Modifica los archivos `.tf`
2. Ejecuta `terraform plan`
3. Revisa los cambios
4. Ejecuta `terraform apply`

## 📚 Recursos adicionales

- [AWS Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Best Practices](https://docs.aws.amazon.com/whitepapers/latest/terraform-on-aws/)

## 🆘 Troubleshooting

### Error: "Access Denied"
Verifica que tus credenciales de AWS tengan permisos suficientes.

### Error: "Invalid AMI"
Cambia la región en `terraform.tfvars` si la AMI no está disponible.

### Terraform no encuentra el archivo user_data.sh
Asegúrate de estar en el directorio `infra/` al ejecutar los comandos.
