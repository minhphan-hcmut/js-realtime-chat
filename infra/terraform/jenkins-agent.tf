
# --- 2. CI/CD Server (Jenkins) ---
resource "proxmox_virtual_environment_vm" "cicd_server_agent" {
  name      = "cicd-jenkins-agent"
  node_name = "devopslab"
  

  clone {
    vm_id = 9000 # ID của template ubuntu-2204-cloudinit-template
  }

  cpu {
    cores = 4
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
        address = "192.168.1.104/24"
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



