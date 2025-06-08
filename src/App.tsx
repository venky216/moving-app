import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  Layout, Typography, Input, Button, Card, Row, Col, Select, Switch, Space, Grid, Spin, ConfigProvider, theme as antdTheme, Tag, Divider, List, Table
} from 'antd';
import { BulbOutlined, MoonOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;
const { Title } = Typography;
const { Content, Header } = Layout;
const { Option } = Select;
const COLORS = [
  '#7C91F9',
  '#B37FEB',
  '#F5A623',
  '#FF8AB2',
  '#34D399',
  '#F87171',
  '#FBBF24',
  '#8B5CF6',
  '#5EEAD4',
  '#FFA07A',
  '#FF9AA2',
  '#EC4899'
];
const CATEGORY_COLORS: Record<string, string> = {
  Furniture: 'magenta',
  Electronics: 'geekblue',
  Kitchen: 'volcano',
  Clothing: 'purple',
  Other: 'gold'
};
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
  const [loading, setLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const screens = useBreakpoint();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await axios.get(`${API}/items`);
    setItems(res.data);
    setLoading(false);
  };

  const handleChange = (field: keyof typeof form, value: string | number | boolean) => {
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
      setForm({ name: '', price: 0, category: '', purchased: false });
      setEditingItemId(null);
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    await axios.delete(`${API}/items/${id}`);
    await fetchItems();
    setLoading(false);
  };

  const editItem = (item: Item) => {
    const { _id, ...rest } = item;
    setForm(rest);
    setEditingItemId(item._id);
  };

  const toggleStatus = async (item: Item) => {
    setLoading(true);
    await axios.put(`${API}/items/${item._id}`, { ...item, purchased: !item.purchased });
    await fetchItems();
    setLoading(false);
  };

  const categoryTotals = items.reduce<CategoryTotals>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map((key) => ({ category: key, total: categoryTotals[key] }));
  const itemPieChartData = items.map((item) => ({ name: item.name, value: item.price }));
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const totalSpent = items.filter(item => item.purchased).reduce((sum, item) => sum + item.price, 0);
  const totalRemaining = totalPrice - totalSpent;
  const formatPrice = (price: number) => price.toLocaleString('en-IN');

  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
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

          <Card style={{ marginBottom: '2rem' }} bodyStyle={{ padding: 0 }}>
            <div style={{ padding: '1rem' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}><Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Item Name" /></Col>
                <Col xs={24} sm={12} md={6}><Input value={form.price.toLocaleString('en-IN')} onChange={(e) => handleChange('price', parseFloat(e.target.value.replace(/,/g, '')) || 0)} placeholder="Price (₹)" /></Col>
                <Col xs={24} sm={12} md={6}>
                  <Select value={form.category} onChange={(value) => handleChange('category', value)} style={{ width: '100%' }} placeholder="Select Category">
                    <Option value="Furniture">Furniture</Option>
                    <Option value="Electronics">Electronics</Option>
                    <Option value="Kitchen">Kitchen</Option>
                    <Option value="Clothing">Clothing</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={4}><Space><span>Purchased</span><Switch checked={form.purchased} onChange={(value) => handleChange('purchased', value)} /></Space></Col>
                <Col xs={24} md={2}><Button style={{ width: '100%' }} type="primary" block onClick={addItem}>{editingItemId ? 'Update' : 'Add'}</Button></Col>
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
                  {
                    title: 'Item Name',
                    dataIndex: 'name',
                    key: 'name'
                  },
                  {
                    title: 'Price (₹)',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `₹${formatPrice(price)}`
                  },
                  {
                    title: 'Category',
                    dataIndex: 'category',
                    key: 'category',
                    render: (cat: string) => <Tag color={CATEGORY_COLORS[cat] || 'default'}>{cat}</Tag>
                  },
                  {
                    title: 'Status',
                    key: 'purchased',
                    render: (_: any, item: Item) => (
                      <Switch checked={item.purchased} onChange={() => toggleStatus(item)} />
                    )
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, item: Item) => (
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

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card><Title level={4}>📊 Category-wise Price Chart</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Price">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card><Title level={4}>📈 Item-wise Price Distribution</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={itemPieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {itemPieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={24}>

            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
