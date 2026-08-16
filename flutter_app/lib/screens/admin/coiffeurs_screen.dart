import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../services/coiffeur_service.dart';
import '../../theme.dart';

class AdminCoiffeursScreen extends StatelessWidget {
  const AdminCoiffeursScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coiffeurs')),
      body: StreamBuilder<List<Coiffeur>>(
        stream: CoiffeurService().watchAll(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          final coiffeurs = snapshot.data!;
          if (coiffeurs.isEmpty) {
            return const Center(
                child: Text("Aucun coiffeur inscrit pour l'instant.", style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: coiffeurs.length,
            itemBuilder: (context, i) => _CoiffeurCard(coiffeur: coiffeurs[i]),
          );
        },
      ),
    );
  }
}

class _CoiffeurCard extends StatefulWidget {
  final Coiffeur coiffeur;
  const _CoiffeurCard({required this.coiffeur});

  @override
  State<_CoiffeurCard> createState() => _CoiffeurCardState();
}

class _CoiffeurCardState extends State<_CoiffeurCard> {
  bool _editing = false;
  late TextEditingController _name;
  late TextEditingController _start;
  late TextEditingController _end;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.coiffeur.displayName);
    _start = TextEditingController(text: widget.coiffeur.workingHours.start);
    _end = TextEditingController(text: widget.coiffeur.workingHours.end);
  }

  @override
  void dispose() {
    _name.dispose();
    _start.dispose();
    _end.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    await CoiffeurService().update(widget.coiffeur.id, {
      'displayName': _name.text.trim().isEmpty ? widget.coiffeur.displayName : _name.text.trim(),
      'workingHours': {'start': _start.text.trim(), 'end': _end.text.trim()},
    });
    setState(() => _editing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_editing) ...[
            TextField(controller: _name, decoration: const InputDecoration(hintText: 'Nom')),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: TextField(controller: _start, decoration: const InputDecoration(hintText: '09:00'))),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('—')),
                Expanded(child: TextField(controller: _end, decoration: const InputDecoration(hintText: '19:00'))),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _editing = false),
                    child: const Text('Annuler'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(child: ElevatedButton(onPressed: _save, child: const Text('Enregistrer'))),
              ],
            ),
          ] else
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.coiffeur.displayName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      Text('${widget.coiffeur.workingHours.start} – ${widget.coiffeur.workingHours.end}',
                          style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _editing = true),
                  child: const Text('Modifier', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          const Divider(height: 20),
          Row(
            children: [
              const Expanded(
                child: Text('Actif (visible pour la réservation)', style: TextStyle(fontSize: 12)),
              ),
              Switch(
                value: widget.coiffeur.active,
                onChanged: (v) => CoiffeurService().update(widget.coiffeur.id, {'active': v}),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
