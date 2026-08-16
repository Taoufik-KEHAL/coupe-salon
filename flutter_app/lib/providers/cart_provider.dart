import 'package:flutter/foundation.dart';

import '../models/models.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  double get total => _items.fold(0, (sum, i) => sum + i.price * i.quantity);

  int get totalDurationMinutes =>
      _items.fold(0, (sum, i) => sum + (i.durationMinutes ?? 0) * i.quantity);

  bool get hasServices => _items.any((i) => i.kind == ItemKind.service);

  void addItem(ServiceProduct item) {
    final index = _items.indexWhere((i) => i.id == item.id);
    if (index != -1) {
      _items[index] = _items[index].copyWith(quantity: _items[index].quantity + 1);
    } else {
      _items.add(CartItem(
        id: item.id,
        kind: item.type,
        name: item.name,
        price: item.price,
        photoUrl: item.photoUrl,
        durationMinutes: item.durationMinutes,
        quantity: 1,
      ));
    }
    notifyListeners();
  }

  void increment(String id) {
    final index = _items.indexWhere((i) => i.id == id);
    if (index != -1) {
      _items[index] = _items[index].copyWith(quantity: _items[index].quantity + 1);
      notifyListeners();
    }
  }

  void decrement(String id) {
    final index = _items.indexWhere((i) => i.id == id);
    if (index == -1) return;
    final nextQuantity = _items[index].quantity - 1;
    if (nextQuantity <= 0) {
      _items.removeAt(index);
    } else {
      _items[index] = _items[index].copyWith(quantity: nextQuantity);
    }
    notifyListeners();
  }

  void remove(String id) {
    _items.removeWhere((i) => i.id == id);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
