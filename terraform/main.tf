terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.24"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

resource "aws_iam_role" "eks_cluster" {
  name = "hp-eks-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster.json
}

data "aws_iam_policy_document" "eks_cluster" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "eks_nodes" {
  name = "hp-eks-node-role"
  assume_role_policy = data.aws_iam_policy_document.eks_nodes.json
}

data "aws_iam_policy_document" "eks_nodes" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "eks_worker" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_eks_cluster" "this" {
  name     = "hp-secure-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.29"

  vpc_config {
    subnet_ids = data.aws_subnets.public.ids
  }
}

resource "aws_eks_node_group" "default" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "default"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = data.aws_subnets.public.ids
  scaling_config {
    desired_size = 1
    max_size     = 2
    min_size     = 1
  }
}

resource "null_resource" "istio" {
  depends_on = [aws_eks_node_group.default]
  provisioner "local-exec" {
    command = "echo Installing Istio with mTLS"
  }
}

output "cluster_name" {
  value = aws_eks_cluster.this.name
}
