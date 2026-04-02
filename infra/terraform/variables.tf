variable "proxmox_api_secret" {
  description = "Secret token để Terraform gọi API Proxmox"
  type        = string
  sensitive   = true 
}