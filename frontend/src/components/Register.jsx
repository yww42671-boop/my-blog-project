import React, { useState } from 'react';

function Register() {
    // 1. 定义状态，用来实时收集用户输入的账号和密码
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // 用来在页面上显示成功或失败的提示

    // 2. 处理表单提交的函数
    const handleSubmit = async (e) => {
        e.preventDefault(); // 阻止表单默认的页面刷新行为
        setMessage('');     // 清空上一次的提示信息

        try {
            // 向我们的 Node.js 后端发起 POST 请求
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // 状态码为 201/200 时，说明注册成功
                setMessage(`✅ ${data.message}`);
                setUsername(''); // 清空输入框
                setPassword(''); 
            } else {
                // 状态码为 400/500 时，说明用户名被占用或有其他错误
                setMessage(`❌ ${data.message}`);
            }
        } catch (error) {
            // 如果后端没开或者网络断了，会走到这里
            setMessage('❌ 无法连接到后端服务器，请确认后端 Node.js 是否正在运行。');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>新用户注册</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>用户名</label>
                    <input 
                        type="text" 
                        placeholder="请输入用户名"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        style={styles.input}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>密码</label>
                    <input 
                        type="password" 
                        placeholder="请输入密码"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={styles.input}
                    />
                </div>
                <button type="submit" style={styles.button}>注 册</button>
            </form>
            
            {/* 如果有提示信息，就把它渲染出来 */}
            {message && <div style={styles.message}>{message}</div>}
        </div>
    );
}

// 顺手写一组极简的内联样式，让页面看起来干净清爽
const styles = {
    container: { maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', marginBottom: '24px', color: '#333' },
    form: { display: 'flex', flexDirection: 'column' },
    inputGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px', outline: 'none' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', transition: 'background 0.2s', marginTop: '10px' },
    message: { marginTop: '20px', padding: '10px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f8f9fa', fontSize: '14px' }
};

export default Register;