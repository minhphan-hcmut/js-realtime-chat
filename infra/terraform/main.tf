terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.60"
    }
  }
}


provider "proxmox" {
  endpoint  = "https://192.168.1.200:8006"
  api_token = "root@pam!terraform=${var.proxmox_api_secret}"

  insecure = true
}

# --- 1. CI/CD Server (Jenkins) ---
resource "proxmox_virtual_environment_vm" "cicd_server" {
  name      = "cicd-jenkins-server"
  node_name = "devopslab"
  

  clone {
    vm_id = 9000 # ID của template ubuntu-2204-cloudinit-template
  }

  cpu {
    cores = 2
  }

  memory {
    dedicated = 4096
  }

  disk {
    datastore_id = "hdd-grp"
    size         = 40
    interface    = "scsi0"
  }

  network_device {
    bridge = "vmbr0"
    model  = "virtio"
  }

  initialization {
    ip_config {
      ipv4 {
        address = "192.168.1.101/24"
        gateway = "192.168.1.1"
      }
    }
    user_account {
      username = "ubuntu"
      keys     = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBt+BEqfWoU2S8+bx46zNr9ANmFlrOoDGOkIq4ofi1lt phanminhkaneki@gmail.com"
      ]
    }
  }
}

# --- 2. Production App Server (Node.js + Nginx) ---
resource "proxmox_virtual_environment_vm" "app_server" {
  name      = "prod-app-server"
  node_name = "devopslab"
  
  clone {
    vm_id = 9000
  }

  cpu {
    cores = 2
  }

  memory {
    dedicated = 2048
  }

  disk {
    datastore_id = "hdd-grp"
    size         = 20
    interface    = "scsi0"
  }

  network_device {
    bridge = "vmbr0"
    model  = "virtio"
  }

  
  initialization {
    ip_config {
      ipv4 {
        address = "192.168.1.102/24"
        gateway = "192.168.1.1"
      }
    }
    user_account {
      username = "ubuntu"
      keys     = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBt+BEqfWoU2S8+bx46zNr9ANmFlrOoDGOkIq4ofi1lt phanminhkaneki@gmail.com"
      ]
    }
  }
}

# --- 3. Database & Cache Server (MongoDB + Redis) ---
resource "proxmox_virtual_environment_vm" "db_server" {
  name      = "prod-db-server"
  node_name = "devopslab"

  clone {
    vm_id = 9000
  }
  cpu {
    cores = 4
  }

  memory {
    dedicated = 4096
  }

  disk {
    datastore_id = "hdd-grp"
    size         = 60
    interface    = "scsi0"
  }

  network_device {
    bridge = "vmbr0"
    model  = "virtio"
  }
  
  initialization {
    ip_config {
      ipv4 {
        address = "192.168.1.103/24"
        gateway = "192.168.1.1"
      }
    }
    user_account {
      username = "ubuntu"
      keys     = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBt+BEqfWoU2S8+bx46zNr9ANmFlrOoDGOkIq4ofi1lt phanminhkaneki@gmail.com"
      ]
    }
  }
}



