output "cluster_name" {
  value = aws_eks_cluster.this.name
}

output "node_role_arn" {
  value = aws_iam_role.eks_nodes.arn
}
