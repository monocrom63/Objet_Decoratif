const fs = require('fs');
const file = 'artifacts/objet-decoratif-store/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldDrawer = `function OrderDetailDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;

  return (
    <>
      <div
        className={\`overlay \${order ? "open" : ""}\`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={\`cart-drawer order-detail-drawer \${order ? "open" : ""}\`}
        role="dialog"
        aria-modal="true"
        aria-label="Order Details"
      >
        <div className="drawer-head">
          <h2>Order {order.orderNumber}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close order details"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
        <div className="order-detail-content">
          <div className="order-detail-grid">
            <div className="order-detail-section">
              <span className="order-detail-section-title">Customer</span>
              <p className="order-detail-text">
                <strong>{order.customerName}</strong>
                <br />
                {order.customerEmail}
                <br />
                {order.phone}
              </p>
            </div>
            <div className="order-detail-section">
              <span className="order-detail-section-title">Delivery Address</span>
              <p className="order-detail-text" style={{ whiteSpace: "pre-line" }}>
                {order.address}
              </p>
            </div>
            <div className="order-detail-section">
              <span className="order-detail-section-title">Payment Method</span>
              <p className="order-detail-text" style={{ textTransform: "capitalize" }}>
                {order.paymentMethod}
              </p>
            </div>
            
            <div className="order-detail-items">
              <span className="order-detail-section-title">Items</span>
              {order.items.map((item) => (
                <div key={item.id} className="order-detail-item">
                  <div className="order-detail-item-info">
                    <strong>{item.name}</strong>
                    <small>{item.scent}</small>
                    <small>Qty: {item.quantity}</small>
                  </div>
                  <span className="order-detail-item-price">€{item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-detail-totals">
              <div className="order-detail-total-row">
                <span>Subtotal</span>
                <span>€{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="order-detail-total-row">
                <span>Shipping</span>
                <span>€{order.shipping.toFixed(2)}</span>
              </div>
              <div className="order-detail-total-row grand-total">
                <span>Total</span>
                <span>€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}`;

const newDrawer = `function OrderDetailDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;

  const getGermanStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "new":
      case "processing":
        return "Bestellt";
      case "shipped":
        return "In Zustellung";
      case "completed":
        return "Geliefert";
      case "cancelled":
        return "Storniert";
      default:
        return status;
    }
  };

  return (
    <>
      <div
        className={\`overlay \${order ? "open" : ""}\`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={\`cart-drawer order-detail-drawer \${order ? "open" : ""}\`}
        role="dialog"
        aria-modal="true"
        aria-label="Order Details"
      >
        <div className="drawer-head">
          <h2>Order {order.orderNumber}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close order details"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
        <div className="order-detail-content">
          <div className="order-detail-grid">
            <div className="order-detail-section">
              <span className="order-detail-section-title">Order Info</span>
              <p className="order-detail-text">
                <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString("de-DE")}
                <br />
                <strong>Status:</strong> {getGermanStatusLabel(order.status)}
              </p>
            </div>
            
            <div className="order-detail-section">
              <span className="order-detail-section-title">Customer</span>
              <p className="order-detail-text">
                <strong>{order.customerName}</strong>
                <br />
                {order.customerEmail}
                <br />
                {order.phone}
              </p>
            </div>
            
            <div className="order-detail-section">
              <span className="order-detail-section-title">Delivery Address</span>
              <p className="order-detail-text" style={{ whiteSpace: "pre-line" }}>
                {order.address}
              </p>
            </div>
            
            <div className="order-detail-section">
              <span className="order-detail-section-title">Payment Method</span>
              <p className="order-detail-text" style={{ textTransform: "capitalize" }}>
                {order.paymentMethod}
              </p>
            </div>
            
            <div className="order-detail-items">
              <span className="order-detail-section-title">Items</span>
              {order.items.map((item) => (
                <div key={item.id} className="order-detail-item">
                  <div className="order-detail-item-info">
                    <strong>{item.name}</strong>
                    <small>{item.scent}</small>
                    <small>Qty: {item.quantity} × €{item.unitPrice.toFixed(2)}</small>
                  </div>
                  <span className="order-detail-item-price">€{item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-detail-totals">
              <div className="order-detail-total-row">
                <span>Subtotal</span>
                <span>€{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="order-detail-total-row">
                <span>Shipping</span>
                <span>€{order.shipping.toFixed(2)}</span>
              </div>
              <div className="order-detail-total-row grand-total">
                <span>Total</span>
                <span>€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}`;

fs.writeFileSync(file, content.replace(oldDrawer, newDrawer));
