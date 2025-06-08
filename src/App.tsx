import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  Layout, Typography, Input, InputNumber, Button, Card, Row, Col, Select, Switch, Space, Divider, Grid
} from 'antd';

const { useBreakpoint } = Grid;
const { Title } = Typography;
const { Content } = Layout;
const { Option } = Select;
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1'];
const API = import.meta.env.VITE_API_URL;

interface Item {
  _id: string;
  name: string;
  price: number;
  category: string;
  purchased: boolean;
}

interface CategoryTotals {
  [category: string]: number;
}

const App = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Omit<Item, '_id'>>({ name: '', price: 0, category: '', purchased: false });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const screens = useBreakpoint();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await axios.get(`${API}/items`);
    setItems(res.data);
  };

  const handleChange = (field: keyof typeof form, value: string | number | boolean) => {
    setForm({ ...form, [field]: value });
  };

  const addItem = async () => {
    if (form.name && form.price && form.category) {
      if (editingItemId) {
        await axios.put(`${API}/items/${editingItemId}`, form);
      } else {
        await axios.post(`${API}/items`, form);
      }
      fetchItems();
      setForm({ name: '', price: 0, category: '', purchased: false });
      setEditingItemId(null);
    }
  };

  const deleteItem = async (id: string) => {
    await axios.delete(`${API}/items/${id}`);
    fetchItems();
  };

  const editItem = (item: Item) => {
    // Remove _id from form state to match Omit<Item, '_id'>
    const { _id, ...rest } = item;
    setForm(rest);
    setEditingItemId(item._id);
  };

  const toggleStatus = async (item: Item) => {
    await axios.put(`${API}/items/${item._id}`, { ...item, purchased: !item.purchased });
    fetchItems();
  };

  const categoryTotals = items.reduce<CategoryTotals>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map((key) => ({ category: key, total: categoryTotals[key] }));
  const itemLineChartData = items.map((item, index) => ({ name: item.name, price: item.price, index }));
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const totalSpent = items.filter(item => item.purchased).reduce((sum, item) => sum + item.price, 0);
  const totalRemaining = totalPrice - totalSpent;
  const formatPrice = (price: number) => price.toLocaleString('en-IN');

  return (
    <Layout style={{ minHeight: '100vh', padding: '2rem', background: '#f0f2f5' }}>
      <Content style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Title level={2} style={{ textAlign: 'center' }}>🏠 Moving Inventory Tracker</Title>
        <Card style={{ marginBottom: '2rem', width: '100%' }}>
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={6}><Input placeholder="Item Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} /></Col>
            <Col xs={24} sm={12} md={6}><InputNumber placeholder="Price (₹)" style={{ width: '100%' }} value={form.price} onChange={(value) => handleChange('price', value ?? 0)} /></Col>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="Select Category" value={form.category} onChange={(value) => handleChange('category', value)} style={{ width: '100%' }}>
                <Option value="Furniture">Furniture</Option>
                <Option value="Electronics">Electronics</Option>
                <Option value="Kitchen">Kitchen</Option>
                <Option value="Clothing">Clothing</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Space><span>Purchased</span><Switch checked={form.purchased} onChange={(value) => handleChange('purchased', value)} /></Space>
            </Col>
            <Col xs={24} md={2}><Button type="primary" block onClick={addItem}>{editingItemId ? 'Update' : 'Add'} Item</Button></Col>
          </Row>
        </Card>

        <Card style={{ marginBottom: '2rem', width: '100%' }}>
          <Title level={4}>📋 Items List</Title>
          <div style={{ display: 'grid', gridTemplateColumns: screens.xs ? '1fr' : '1fr 1fr 1fr 1fr 1fr', fontWeight: 'bold', marginBottom: 8 }}>
            <div>Item Name</div><div>Price (₹)</div><div>Category</div><div>Status</div><div>Actions</div>
          </div>
          {items.map((item) => (
            <div key={item._id} style={{ display: 'grid', gridTemplateColumns: screens.xs ? '1fr' : '1fr 1fr 1fr 1fr 1fr', padding: '6px 0', alignItems: 'center' }}>
              <div>{item.name}</div>
              <div>₹{formatPrice(item.price)}</div>
              <div>{item.category}</div>
              <div><Switch checked={item.purchased} onChange={() => toggleStatus(item)} /></div>
              <div><Space><Button size="small" onClick={() => editItem(item)}>Edit</Button><Button size="small" danger onClick={() => deleteItem(item._id)}>Delete</Button></Space></div>
            </div>
          ))}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '0.9rem', fontWeight: 500, color: '#555' }}>
            <span>Total Price: <span style={{ color: '#000' }}>₹{formatPrice(totalPrice)}</span></span>
            <span>Spent: <span style={{ color: '#52c41a' }}>₹{formatPrice(totalSpent)}</span></span>
            <span>Remaining: <span style={{ color: '#fa541c' }}>₹{formatPrice(totalRemaining)}</span></span>
          </div>
        </Card>

        <Row gutter={[24, 24]} style={{ width: '100%' }}>
          <Col xs={24} md={12}>
            <Card><Title level={4}>📊 Category-wise Price Chart</Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}><XAxis dataKey="category" /><YAxis /><Tooltip /><Legend /><Bar dataKey="total" fill="#1890ff" name="Total Price" /></BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card><Title level={4}>📈 Item-wise Price Line Chart</Title>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={itemLineChartData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="price" stroke="#52c41a" name="Price" /></LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={24}>
            <Card><Title level={4}>🟠 Category Distribution Pie</Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={chartData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>{chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App;