// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Layout, Typography, Input, Button, Row, Col, Select, Switch, Space, Grid, Spin, ConfigProvider, theme as antdTheme, Tag, Divider, Table, Card
} from 'antd';
import { BulbOutlined, MoonOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
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
  'very high': 'red',
  high: 'volcano',
  medium: 'gold',
  low: 'cyan',
  'very low': 'green'
};

const PRIORITY_COLORS_FOR_CHART = {
  'very high': '#cf1322',
  high: '#d4380d',
  medium: '#d48806',
  low: '#08979c',
  'very low': '#389e0d'
};
const PRIORITY_OPTIONS = Object.keys(PRIORITY_COLORS);
const API = import.meta.env.VITE_API_URL;

const App = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', price: 0, category: '', purchased: false, quantity: 1, priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const screens = useBreakpoint();
  const [editingKey, setEditingKey] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setEditingKey(null);
        setEditField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await axios.get(`${API}/items`);
    const PRIORITY_ORDER = ['very high', 'high', 'medium', 'low', 'very low'];
    const sortedItems = res.data.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
    setItems(sortedItems);
    setLoading(false);
  };

  const updateItem = async (id, data) => {
    setLoading(true);
    await axios.put(`${API}/items/${id}`, data);
    await fetchItems();
    setLoading(false);
    setEditingKey(null);
    setEditField(null);
  };

  const addItem = async () => {
    if (form.name && form.price && form.category) {
      setLoading(true);
      await axios.post(`${API}/items`, form);
      await fetchItems();
      setForm({ name: '', price: 0, category: '', purchased: false, quantity: 1, priority: 'medium' });
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    setLoading(true);
    await axios.delete(`${API}/items/${id}`);
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

  const priorityChartData = Object.keys(priorityTotals).map((key) => ({ priority: key, total: priorityTotals[key] }));
  const chartData = Object.keys(categoryTotals).map((key) => ({ category: key, total: categoryTotals[key] }));
  const itemPieChartData = items.map((item) => ({ name: item.name, value: item.price * (item.quantity ?? 1) }));
   const totalPrice = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const totalSpent = items.filter(item => item.purchased).reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const totalRemaining = totalPrice - totalSpent;
  const formatPrice = (price) => price.toLocaleString('en-IN');

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      onCell: (record) => ({
        onDoubleClick: () => { setEditingKey(record._id); setEditField('name'); setEditValue(record.name); }
      }),
      render: (text, record) =>
        editingKey === record._id && editField === 'name' ? (
          <Space>
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <Button icon={<SaveOutlined />} onClick={() => updateItem(record._id, { ...record, name: editValue })} />
          </Space>
        ) : text
    },
    {
      title: 'Price',
      dataIndex: 'price',
      onCell: (record) => ({
        onDoubleClick: () => { setEditingKey(record._id); setEditField('price'); setEditValue(record.price); }
      }),
      render: (text, record) =>
        editingKey === record._id && editField === 'price' ? (
          <Space>
            <Input type='number' value={editValue} onChange={(e) => setEditValue(Number(e.target.value))} />
            <Button icon={<SaveOutlined />} onClick={() => updateItem(record._id, { ...record, price: editValue })} />
          </Space>
        ) : text
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      onCell: (record) => ({
        onDoubleClick: () => { setEditingKey(record._id); setEditField('quantity'); setEditValue(record.quantity); }
      }),
      render: (text, record) =>
        editingKey === record._id && editField === 'quantity' ? (
          <Space>
            <Input type='number' value={editValue} onChange={(e) => setEditValue(Number(e.target.value))} />
            <Button icon={<SaveOutlined />} onClick={() => updateItem(record._id, { ...record, quantity: editValue })} />
          </Space>
        ) : text
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      onCell: (record) => ({
        onDoubleClick: () => { setEditingKey(record._id); setEditField('priority'); setEditValue(record.priority); }
      }),
      render: (text, record) =>
        editingKey === record._id && editField === 'priority' ? (
          <Space>
            <Select value={editValue} onChange={setEditValue}>
              {PRIORITY_OPTIONS.map(p => <Option key={p}>{p}</Option>)}
            </Select>
            <Button icon={<SaveOutlined />} onClick={() => updateItem(record._id, { ...record, priority: editValue })} />
          </Space>
        ) : <Tag color={PRIORITY_COLORS[text]}>{text}</Tag>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      onCell: (record) => ({
        onDoubleClick: () => { setEditingKey(record._id); setEditField('category'); setEditValue(record.category); }
      }),
      render: (text, record) =>
        editingKey === record._id && editField === 'category' ? (
          <Space>
            <Select value={editValue} onChange={setEditValue}>
              {Object.keys(CATEGORY_COLORS).map(cat => <Option key={cat}>{cat}</Option>)}
            </Select>
            <Button icon={<SaveOutlined />} onClick={() => updateItem(record._id, { ...record, category: editValue })} />
          </Space>
        ) : <Tag color={CATEGORY_COLORS[text]}>{text}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'purchased',
      render: (val, record) => <Switch checked={val} onChange={(checked) => updateItem(record._id, { ...record, purchased: checked })} />
    },
    {
      title: 'Actions',
      render: (_, record) => <Button danger icon={<DeleteOutlined />} onClick={() => deleteItem(record._id)} />
    }
  ];

  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh', width: '100vw' }}>
        <Header style={{ background: isDarkMode ? '#1f1f1f' : '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' }}>
          <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000', margin: 0 }}>🏠 Moving Inventory</Title>
          <Button shape="circle" icon={isDarkMode ? <BulbOutlined /> : <MoonOutlined />} onClick={() => setIsDarkMode(!isDarkMode)} />
        </Header>
        <Content style={{ padding: '1rem', width: '100%' }}>
          {loading && (
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" />
            </div>
          )}
          <Card style={{ marginBottom: '2rem' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={4}><label>Name</label><Input placeholder='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Col>
              <Col xs={24} sm={12} md={3}><label>Price</label><Input placeholder='Price' value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Col>
              <Col xs={24} sm={12} md={3}><label>Qty</label><Input placeholder='Qty' value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></Col>
              <Col xs={24} sm={12} md={4}><label>Category</label><Select value={form.category} style={{ width: '100%' }} onChange={(value) => setForm({ ...form, category: value })}>{Object.keys(CATEGORY_COLORS).map(cat => <Option key={cat}>{cat}</Option>)}</Select></Col>
              <Col xs={24} sm={12} md={4}><label>Priority</label><Select value={form.priority} style={{ width: '100%' }} onChange={(value) => setForm({ ...form, priority: value })}>{PRIORITY_OPTIONS.map(p => <Option key={p}>{p}</Option>)}</Select></Col>
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
                    <Switch checked={form.purchased} onChange={(value) => setForm({ ...form, purchased: value })} />
                  </div>
                </Col>
              <Col xs={24} sm={12} md={2}><label>&nbsp;</label><Button block type='primary' onClick={addItem}>Add</Button></Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={items}
            rowKey="_id"
            pagination={false}
            scroll={{ x: 600 }}
          />

          <div style={{ backgroundColor: '#f0f2f5', padding: '1rem 2rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '1rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
            <span>Total Price: <span style={{ color: '#6C63FF', fontWeight: 700 }}>₹{formatPrice(totalPrice)}</span></span>
            <span>Spent: <span style={{ color: '#5A827E', fontWeight: 700 }}>₹{formatPrice(totalSpent)}</span></span>
            <span>Remaining: <span style={{ color: '#E6521F', fontWeight: 700 }}>₹{formatPrice(totalRemaining)}</span></span>
          </div>

          <Divider />

          <Row gutter={[24, 24]} style={{ marginTop: '2rem' }}>
            <Col xs={24} md={12}><Card><Title level={4}>📈 Category-wise Price Chart</Title><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>{chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></Card></Col>
            <Col xs={24} md={12}><Card><Title level={4}>📊 Item-wise Price Distribution</Title><ResponsiveContainer width="100%" height={300}><BarChart data={itemPieChartData}><XAxis dataKey="name" tick={{ fontSize: 12, angle: -30, textAnchor: 'end' }} interval={0} height={60} /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" name="Price">{itemPieChartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer></Card></Col>
            <Col span={24}><Card><Title level={4}>📌 Priority-wise Price Breakdown</Title><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={priorityChartData} dataKey="total" nameKey="priority" cx="50%" cy="50%" outerRadius={100} label>{priorityChartData.map((data, index) => (<Cell key={`cell-priority-${index}`} fill={PRIORITY_COLORS_FOR_CHART[data.priority]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></Card></Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;