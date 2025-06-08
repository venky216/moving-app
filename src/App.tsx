// @ts-nocheck

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  Layout, Typography, Input, Button, Card, Row, Col, Select, Switch, Space, Grid, Spin, ConfigProvider, theme as antdTheme, Tag, Divider, List, Table
} from 'antd';
import { BulbOutlined, MoonOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import './App.css';

const { useBreakpoint } = Grid;
const { Title } = Typography;
const { Content, Header } = Layout;
const { Option } = Select;
const COLORS = [
  '#7C91F9', '#B37FEB', '#F5A623', '#FF8AB2', '#34D399', '#F87171', '#FBBF24', '#8B5CF6', '#5EEAD4', '#FFA07A', '#FF9AA2', '#EC4899'
];
const CATEGORY_COLORS = {
  Furniture: 'magenta',
  Electronics: 'geekblue',
  Kitchen: 'volcano',
  Clothing: 'purple',
  Other: 'gold'
};
const PRIORITY_COLORS = {
  'very high': 'green',
  high: 'cyan',
  medium: 'gold',
  low: 'volcano',
  'very low': 'red'
};
const PRIORITY_OPTIONS = Object.keys(PRIORITY_COLORS);
const API = import.meta.env.VITE_API_URL;

const App = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', price: 0, category: '', purchased: false, quantity: 1, priority: 'medium' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const screens = useBreakpoint();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await axios.get(`${API}/items`);
    const PRIORITY_ORDER = ['very high', 'high', 'medium', 'low', 'very low'];
    const sortedItems = res.data.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
    setItems(sortedItems);
    setLoading(false);
  };
  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const addItem = async () => {
    if (form.name && form.price && form.category) {
      setLoading(true);
      if (editingItemId) {
        await axios.put(`${API}/items/${editingItemId}`, form);
      } else {
        await axios.post(`${API}/items`, form);
      }
      await fetchItems();
      setForm({ name: '', price: 0, category: '', purchased: false, quantity: 1, priority: 'medium' });
      setEditingItemId(null);
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    setLoading(true);
    await axios.delete(`${API}/items/${id}`);
    await fetchItems();
    setLoading(false);
  };

  const editItem = (item) => {
    const { _id, ...rest } = item;
    setForm(rest);
    setEditingItemId(item._id);
  };

  const toggleStatus = async (item) => {
    setLoading(true);
    await axios.put(`${API}/items/${item._id}`, { ...item, purchased: !item.purchased });
    await fetchItems();
    setLoading(false);
  };

  const categoryTotals = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {});

  const priorityTotals = items.reduce((acc, item) => {
  acc[item.priority] = (acc[item.priority] || 0) + item.price;
  return acc;
}, {});
const priorityChartData = Object.keys(priorityTotals).map((key) => ({
  priority: key,
  total: priorityTotals[key]
}));

  const chartData = Object.keys(categoryTotals).map((key) => ({ category: key, total: categoryTotals[key] }));
  const itemPieChartData = items.map((item) => ({ name: item.name, value: item.price * (item?.quantity ?? 1) }));
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const totalSpent = items.filter(item => item.purchased).reduce((sum, item) => sum + item.price, 0);
  const totalRemaining = totalPrice - totalSpent;
  const formatPrice = (price) => price.toLocaleString('en-IN');

  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh', width: '100vw' }}>
        <Header style={{ background: isDarkMode ? '#1f1f1f' : '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' }}>
          <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000', margin: 0 }}>🏠 Moving Inventory</Title>
          <Button shape="circle" icon={isDarkMode ? <BulbOutlined /> : <MoonOutlined />} onClick={() => setIsDarkMode(!isDarkMode)} />
        </Header>
        <Content style={{ padding: '1rem', width: '100%', transition: 'none' }}>
          {loading && (
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" />
            </div>
          )}

          <Card style={{ marginBottom: '2rem' }} bodyStyle={{ padding: 0 }}>
            <div style={{ marginBottom: '2rem', padding: '1rem', background: isDarkMode ? '#1f1f1f' : '#fff', borderRadius: 8 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={4}>
                  <label>Item Name</label>
                  <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                </Col>
                <Col xs={24} sm={12} md={3}>
                  <label>Item Value</label>
                  <Input value={form.price.toLocaleString('en-IN')} onChange={(e) => handleChange('price', parseFloat(e.target.value.replace(/,/g, '')) || 0)} />
                </Col>
                <Col xs={24} sm={12} md={3}>
                  <label>Quantity</label>
                  <Input value={form.quantity} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)} />
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <label>Category</label>
                  <Select value={form.category} onChange={(value) => handleChange('category', value)} style={{ width: '100%' }}>
                    <Option value="Furniture">Furniture</Option>
                    <Option value="Electronics">Electronics</Option>
                    <Option value="Kitchen">Kitchen</Option>
                    <Option value="Clothing">Clothing</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <label>Priority</label>
                  <Select value={form.priority} onChange={(value) => handleChange('priority', value)} style={{ width: '100%' }}>
                    {PRIORITY_OPTIONS.map(p => <Option key={p} value={p}>{p}</Option>)}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={2}>
                  <label>Status</label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      padding: '4px 11px',
                      height: '32px'
                    }}
                  >
                    {/* <span>Purchased</span> */}
                    <Switch checked={form.purchased} onChange={(value) => handleChange('purchased', value)} />
                  </div>
                </Col>
                <Col xs={24} md={2}>
                  <label>&nbsp;</label>
                  <Button style={{ width: '100%' }} type="primary" block onClick={addItem}>{editingItemId ? 'Update' : 'Add'}</Button>
                </Col>
              </Row>
            </div>
          </Card>

          <Card style={{ marginBottom: '2rem' }}>
            <Title level={4}>📋 Items {screens.xs ? 'List' : 'Table'}</Title>
            {screens.xs ? (
              <List
                itemLayout="vertical"
                dataSource={items}
                rowKey="_id"
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>{item.name}</b> <Switch checked={item.purchased} onChange={() => toggleStatus(item)} /></div>}
                      description={
                        <>
                          <span>₹{formatPrice(item.price)}</span> {' - '}
                          <span>Qty: {item.quantity}</span> {' - '}
                          <Tag color={PRIORITY_COLORS[item.priority]}>{item.priority}</Tag> {' - '}
                          <Tag color={CATEGORY_COLORS[item.category] || 'default'}>{item.category}</Tag>
                        </>
                      }
                    />
                    <Space style={{ marginTop: 8 }}>
                      <Button size="small" icon={<EditOutlined />} onClick={() => editItem(item)} />
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteItem(item._id)} />
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Table
                columns={[
                  { title: 'Item Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
                  { title: 'Price (₹)', dataIndex: 'price', key: 'price', render: (p) => `₹${formatPrice(p)}`, sorter: (a, b) => a.price - b.price },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
                  {
                    title: 'Priority',
                    dataIndex: 'priority',
                    key: 'priority',
                    filters: PRIORITY_OPTIONS.map(p => ({ text: p, value: p })),
                    onFilter: (value, record) => record.priority === value,
                    sorter: (a, b) => PRIORITY_OPTIONS.indexOf(a.priority) - PRIORITY_OPTIONS.indexOf(b.priority),
                    render: (priority) => <Tag color={PRIORITY_COLORS[priority]}>{priority}</Tag>
                  },
                  {
                    title: 'Category',
                    dataIndex: 'category',
                    key: 'category',
                    filters: Object.keys(CATEGORY_COLORS).map(cat => ({ text: cat, value: cat })),
                    onFilter: (value, record) => record.category === value,
                    render: (cat) => <Tag color={CATEGORY_COLORS[cat] || 'default'}>{cat}</Tag>
                  },
                  {
                    title: 'Status',
                    key: 'purchased',
                    render: (_, item) => <Switch checked={item.purchased} onChange={() => toggleStatus(item)} />
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, item) => (
                      <Space>
                        <Button size="small" icon={<EditOutlined />} onClick={() => editItem(item)} />
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteItem(item._id)} />
                      </Space>
                    )
                  }
                ]}
                dataSource={items}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 600 }}
              />
            )}
            <Divider />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '2rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <span>Total Price: <span style={{ color: '#6C63FF' }}>₹{formatPrice(totalPrice)}</span></span>
              <span>Spent: <span style={{ color: '#5A827E' }}>₹{formatPrice(totalSpent)}</span></span>
              <span>Remaining: <span style={{ color: '#E6521F' }}>₹{formatPrice(totalRemaining)}</span></span>
            </div>
          </Card>

          <Row gutter={[24, 24]} style={{ marginTop: '2rem' }}>
            <Col xs={24} md={12}>
              <Card>
                <Title level={4}>📈 Category-wise Price Chart</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Title level={4}>📊 Item-wise Price Distribution</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={itemPieChartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, angle: -30, textAnchor: 'end' }}
                      interval={0}
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Price">
                      {itemPieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
             <Col span={12}>
    <Card>
      <Title level={4}>📌 Priority-wise Price Breakdown</Title>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={priorityChartData}
            dataKey="total"
            nameKey="priority"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {priorityChartData.map((data, index) => (
              <Cell key={`cell-priority-${index}`} fill={PRIORITY_COLORS[data.priority]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  </Col>
          </Row>

        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
