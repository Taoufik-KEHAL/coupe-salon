import 'package:flutter/material.dart';

import '../theme.dart';

class CatalogCard extends StatelessWidget {
  final String name;
  final String photoUrl;
  final double price;
  final int? durationMinutes;
  final VoidCallback onAdd;
  final bool large;

  const CatalogCard({
    super.key,
    required this.name,
    required this.photoUrl,
    required this.price,
    this.durationMinutes,
    required this.onAdd,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: large ? 220 : 160,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Image.network(
            photoUrl,
            height: 110,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(height: 110, color: AppColors.border),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (durationMinutes != null)
                  Text('${durationMinutes}min',
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                SizedBox(
                  height: 34,
                  child: Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${price.toStringAsFixed(0)} DHS',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    InkWell(
                      onTap: onAdd,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                        child: const Icon(Icons.add, size: 18, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
