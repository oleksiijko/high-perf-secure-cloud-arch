output "cluster_name" {
  value = aws_eks_cluster.this.name
}

output "node_role" {
  value = aws_iam_role.node.name
}
