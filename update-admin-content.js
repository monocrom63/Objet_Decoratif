const fs = require('fs');

const file = 'artifacts/objet-decoratif-store/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('function AdminContent()');
const endIdx = content.indexOf('function App()');
const prefix = content.substring(0, startIdx);
const suffix = content.substring(endIdx);

const newAdminContent = `
function OrderDetailDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
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
}

function AdminContent() {
  const me = useGetMe();
  const orders = useListAdminOrders();
  const users = useListAdminUsers();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const changeStatus = async (id: number, status: OrderStatus) => {
    await updateStatus.mutateAsync({ id, data: { status } });
    await orders.refetch();
  };

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

  if (me.isLoading)
    return (
      <EditorialPageFrame>
        <main className="section">
          <p>Loading…</p>
        </main>
      </EditorialPageFrame>
    );

  if (me.data?.role !== "admin") {
    return (
      <EditorialPageFrame>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">
              Administration / Objet Décoratif
            </div>
            <h1>
              Admin access
              <br />
              <em>required.</em>
            </h1>
            <div className="account-hero-actions">
              <Link href="/account" className="outline-button">
                Return to account <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
      </EditorialPageFrame>
    );
  }

  const revenue =
    orders.data
      ?.filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0) ?? 0;

  return (
    <>
      <EditorialPageFrame>
        <section className="editorial-hero about-hero">
          <div className="editorial-hero-copy">
            <div className="section-kicker">Administration / Objet Décoratif</div>
            <span className="eyebrow">{me.data?.name || me.data?.email}</span>
            <h1>
              Admin
              <br />
              <em>dashboard.</em>
            </h1>
            <p>Manage customers and fulfillment across the store.</p>
            <div className="account-hero-actions">
              <Link href="/account" className="outline-button">
                Customer view <ArrowRight size={13} />
              </Link>
              <UserButton />
            </div>
          </div>
          <div className="editorial-hero-note">
            Orders: {orders.data?.length ?? 0} / Revenue: €{revenue.toFixed(2)}
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-label">
            01 / Store overview
            <br />
            <span>Fulfilment & Customers</span>
          </div>
          <div className="editorial-section-content">
            <div className="section-kicker">Store metrics</div>
            <h2>Overview</h2>
            <div className="admin-metrics">
              <div className="admin-metric">
                <span>Orders</span>
                <strong>{orders.data?.length ?? 0}</strong>
              </div>
              <div className="admin-metric">
                <span>Customers</span>
                <strong>
                  {users.data?.filter((user) => user.role === "customer")
                    .length ?? 0}
                </strong>
              </div>
              <div className="admin-metric">
                <span>Order value</span>
                <strong>€{revenue.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-label">
            02 / All orders
            <br />
            <span>Fulfilment</span>
          </div>
          <div className="editorial-section-content">
            <div className="section-kicker">Order management</div>
            <h2>All orders</h2>
            <div className="admin-orders-list">
              <div className="admin-orders-header">
                <span>Order</span>
                <span>Customer</span>
                <span>Items</span>
                <span>Total</span>
                <span>Status</span>
              </div>
              {orders.data?.map((order) => (
                <div 
                  key={order.id} 
                  className="admin-order-row"
                  onClick={() => setSelectedOrder(order)}
                  data-testid={\`row-order-\${order.id}\`}
                >
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString("de-DE")}
                    </small>
                  </div>
                  <div>
                    <span className="admin-customer-name">
                      {order.customerName}
                    </span>
                    <small>{order.customerEmail}</small>
                  </div>
                  <div>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div>€{order.total.toFixed(2)}</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      className="admin-status-select"
                      value={order.status === "new" ? "processing" : order.status}
                      onChange={(event) =>
                        changeStatus(order.id, event.target.value as OrderStatus)
                      }
                      data-testid={\`select-status-\${order.id}\`}
                    >
                      <option value="processing">Bestellt</option>
                      <option value="shipped">In Zustellung</option>
                      <option value="completed">Geliefert</option>
                      <option value="cancelled">Storniert</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-label">
            03 / Users
            <br />
            <span>Accounts</span>
          </div>
          <div className="editorial-section-content">
            <div className="section-kicker">Customer management</div>
            <h2>All users</h2>
            <div className="admin-users-list">
              {users.data?.map((user) => (
                <div key={user.id} className="admin-user-row">
                  <div className="admin-user-info">
                    <strong>{user.name || "Unnamed customer"}</strong>
                    <small>
                      {user.email} · {user.role}
                    </small>
                  </div>
                  <div className="admin-user-stats">
                    <span>{user.orderCount} orders</span>
                    <b>€{user.totalSpent.toFixed(2)}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </EditorialPageFrame>
      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}
`;

fs.writeFileSync(file, prefix + newAdminContent + suffix);
