import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/catalog_service.dart';
import '../../theme.dart';

class AdminServicesScreen extends StatelessWidget {
  const AdminServicesScreen({super.key});

  void _openForm(BuildContext context, {ServiceProduct? item}) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _ItemForm(item: item),
    );
  }

  void _confirmDelete(BuildContext context, ServiceProduct item) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer'),
        content: Text('Supprimer "${item.name}" ?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Annuler')),
          TextButton(
            onPressed: () {
              CatalogService().delete(item.id);
              Navigator.of(context).pop();
            },
            child: const Text('Supprimer', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Services & produits')),
      body: StreamBuilder<List<ServiceProduct>>(
        stream: CatalogService().watchAll(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          final items = snapshot.data!;
          if (items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text("Aucun service ni produit pour l'instant.",
                        style: TextStyle(color: AppColors.textMuted), textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => CatalogService().seed(),
                      child: const Text('Importer un catalogue de démarrage'),
                    ),
                  ],
                ),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.only(bottom: 90),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final item = items[i];
              return ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(item.photoUrl, width: 48, height: 48, fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(width: 48, height: 48, color: AppColors.border)),
                ),
                title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: Text(
                  '${item.type == ItemKind.service ? "${item.durationMinutes} min · " : ""}${item.price.toStringAsFixed(0)} DHS',
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, size: 20, color: AppColors.primary),
                      onPressed: () => _openForm(context, item: item),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.danger),
                      onPressed: () => _confirmDelete(context, item),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(context),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _ItemForm extends StatefulWidget {
  final ServiceProduct? item;
  const _ItemForm({this.item});

  @override
  State<_ItemForm> createState() => _ItemFormState();
}

class _ItemFormState extends State<_ItemForm> {
  late ItemKind _type;
  late final TextEditingController _name;
  late final TextEditingController _photoUrl;
  late final TextEditingController _price;
  late final TextEditingController _duration;
  bool _featured = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final item = widget.item;
    _type = item?.type ?? ItemKind.service;
    _name = TextEditingController(text: item?.name ?? '');
    _photoUrl = TextEditingController(text: item?.photoUrl ?? '');
    _price = TextEditingController(text: item != null ? item.price.toStringAsFixed(0) : '');
    _duration = TextEditingController(text: item?.durationMinutes?.toString() ?? '');
    _featured = item?.featured ?? false;
  }

  @override
  void dispose() {
    _name.dispose();
    _photoUrl.dispose();
    _price.dispose();
    _duration.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty || _photoUrl.text.trim().isEmpty || _price.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    final payload = {
      'type': _type == ItemKind.service ? 'service' : 'produit',
      'name': _name.text.trim(),
      'photoUrl': _photoUrl.text.trim(),
      'price': double.tryParse(_price.text) ?? 0,
      if (_type == ItemKind.service) 'durationMinutes': int.tryParse(_duration.text) ?? 0,
      'featured': _featured,
    };
    try {
      if (widget.item != null) {
        await CatalogService().update(widget.item!.id, payload);
      } else {
        await CatalogService().create(ServiceProduct(
          id: '',
          type: _type,
          name: payload['name'] as String,
          photoUrl: payload['photoUrl'] as String,
          price: payload['price'] as double,
          durationMinutes: payload['durationMinutes'] as int?,
          featured: _featured,
        ));
      }
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.item != null ? 'Modifier' : 'Ajouter',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _TypeChip(
                    label: 'Service',
                    active: _type == ItemKind.service,
                    onTap: () => setState(() => _type = ItemKind.service),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _TypeChip(
                    label: 'Produit',
                    active: _type == ItemKind.produit,
                    onTap: () => setState(() => _type = ItemKind.produit),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(controller: _name, decoration: const InputDecoration(hintText: 'Nom')),
            const SizedBox(height: 10),
            TextField(controller: _photoUrl, decoration: const InputDecoration(hintText: 'URL de la photo')),
            const SizedBox(height: 10),
            TextField(
              controller: _price,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'Prix (DHS)'),
            ),
            if (_type == ItemKind.service) ...[
              const SizedBox(height: 10),
              TextField(
                controller: _duration,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(hintText: 'Durée (minutes)'),
              ),
            ],
            Row(
              children: [
                Expanded(child: const Text('Mettre en avant (Offres du moment)', style: TextStyle(fontSize: 13))),
                Switch(value: _featured, onChanged: (v) => setState(() => _featured = v)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Annuler'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Enregistrer'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _TypeChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? Colors.white : AppColors.text)),
      ),
    );
  }
}
