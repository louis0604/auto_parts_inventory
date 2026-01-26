# 汽车配件库存管理系统 - 开发清单

## 数据库设计
- [x] 设计配件表（parts）
- [x] 设计供应商表（suppliers）
- [x] 设计客户表（customers）
- [x] 设计采购订单表（purchase_orders）
- [x] 设计采购订单明细表（purchase_order_items）
- [x] 设计销售发票表（sales_invoices）
- [x] 设计销售发票明细表（sales_invoice_items）
- [x] 设计库存分类账表（inventory_ledger）
- [x] 设计配件分类表（part_categories）
- [x] 推送数据库迁移

## 视觉风格配置
- [x] 配置赛博朋克主题色彩（霜虹粉/电子青/深黑）
- [x] 引入几何无衬线字体（Orbitron/Rajdhani）
- [x] 创建HUD风格的UI组件
- [x] 配置霜虹发光效果CSS
- [x] 创建Dashboard布局组件

## 核心数据管理模块
- [x] 配件管理：列表、添加、编辑、删除、搜索
- [x] 供应商管理：列表、添加、编辑、删除、搜索
- [x] 客户管理：列表、添加、编辑、删除、搜索
- [x] 配件分类管理

## 业务流程模块
- [x] 采购订单：创建订单、订单列表、订单详情、入库操作
- [x] 销售发票：创建发票、发票列表、发票详情、出库操作
- [x] 库存分类账：记录所有库存变动、查询历史记录

## 库存预警功能
- [x] 设置配件最低库存阈值
- [x] 低库存自动检测
- [x] 应用内消息通知
- [ ] 邮件通知功能

## 数据统计仪表盘
- [x] 库存概览卡片
- [ ] 销售趋势图表（折线图）
- [ ] 采购统计图表（柱状图）
- [ ] 配件分类分布（饼图）
- [x] 低库存预警列表
- [ ] 应付/应收账款统计

## 报表导出功能
- [ ] 库存报表导出（Excel/PDF）
- [ ] 销售报表导出（Excel/PDF）
- [ ] 采购报表导出（Excel/PDF）

## 智能补货建议
- [x] 集成LLM分析历史数据
- [x] 生成智能补货建议
- [x] 展示补货建议列表

## 测试和优化
- [x] 编写核心功能单元测试
- [x] 测试所有业务流程
- [x] 性能优化
- [x] 响应式布局优化

## Bug修复
- [x] 修复添加配件功能的错误

## 新需求和Bug修复
- [x] 检查SKU删除功能（代码实现正确）
- [x] 将视觉风格从赛博朋克改为传统ERP界面风格（灰白色调、工具栏、标签页布局）

## 删除配件外键约束错误修复
- [x] 检查数据库外键关系
- [x] 修改删除逻辑，先检查是否被引用
- [x] 添加级联删除或阻止删除的提示

## 管理员强制删除配件功能
- [x] 在db.ts中添加forceDeletePart函数，删除配件及所有相关记录
- [x] 在routers.ts中添加forceDelete API端点，仅管理员可用
- [x] 在Parts.tsx中添加二次确认对话框
- [x] 测试强制删除功能

## 仪表盘快速操作404错误修复
- [x] 检查Dashboard.tsx中的快速操作按钮路由
- [x] 检查App.tsx中的路由配置
- [x] 修复路由跳转问题

## 供应商和客户强制删除功能
- [x] 在db.ts中添加forceDeleteSupplier函数
- [x] 在routers.ts中添加suppliers.forceDelete API
- [x] 在Suppliers.tsx中添加强制删除对话框
- [x] 在db.ts中添加forceDeleteCustomer函数
- [x] 在routers.ts中添加customers.forceDelete API
- [x] 在Customers.tsx中添加强制删除对话框

## 批量导入和快速批量添加功能
- [x] 为配件管理添加Excel批量导入功能
- [x] 添加Excel模板下载功能
- [x] 解析Excel文件并批量创建配件
- [ ] 为配件管理添加AI辅助导入功能
- [ ] 优化采购订单批量添加配件体验

## 销售发票专业格式重新设计
- [x] 重新设计SalesInvoices.tsx为专业汽车配件发票格式
- [x] 添加公司Logo和完整信息区域
- [x] 添加客户信息（SOLD TO / SHIP TO）
- [x] 添加车辆信息字段（年份、品牌、型号）
- [x] 重新设计配件列表表格（包含制造商、配件编号、订购/发货数量、建议零售价、净价等列）
- [x] 添加发票打印功能

## 销售发票输入框大小优化
- [x] 调整数量和单价列的宽度，使输入框更大更易用
- [x] 进一步增加数量和单价列宽度，确保能完整显示三位数及以上的数字
- [x] 调整Input组件实际宽度，使其占满整个单元格
- [x] 将所有价格单位从¥改为$
- [x] 修复Input组件文字被截断的问题，调整padding和文字对齐

## 配件Line Code和发票显示优化
- [x] 为配件表添加line_code字段（产品线代码）
- [x] 更新数据库schema并推送迁移
- [x] 修改销售发票创建表单，将配件描述放在SKU下面显示
- [x] 更新配件管理页面，支持line_code的添加和编辑
- [x] 更新Excel批量导入功能，支持line_code字段

## 配件管理页面Line Code显示和搜索
- [x] 在配件列表表格中添加Line Code列
- [x] 实现按Line Code搜索和筛选配件功能

## Line Code管理和筛选功能
- [x] 创廻line_codes数据表
- [x] 调整配件表，将lineCode改为外键关联line_codes表
- [x] 创建Line Code管理的后端接口（增删改查）
- [x] 调整配件列表表格，将Line Code列移到SKU前面
- [x] 创建Line Code管理界面（可添加、编辑、删除Line Code）
- [x] 在配件管理页面添加Line Code下拉筛选器
- [x] 更新配件添加/编辑表单，使用Line Code下拉选择
- [x] 更新Excel导入功能，支持Line Code名称匹配

## 配件表单重新设计（按照参考图格式）
- [x] 更新数据库schema添加新字段（Cost成本价、Retail零售价、CoreCost、CoreRetail、Manufacturer、MfgPartNumber、OrderMultiple、Weight、StockingUnit、PurchaseUnit等）
- [x] 更新后端接口支持新字段
- [x] 重新设计配件添加/编辑表单，采用左右两列布局
- [x] 更新配件列表显示，保持核心字段显示
- [x] 更新Excel导入模板，支持新字段

## 配件图片上传功能
- [x] 数据库添加imageUrl字段存储S3图片URL
- [x] 创建图片上传组件（支持预览、上传到S3、删除）
- [x] 在配件表单右侧集成图片上传功能
- [x] 更新配件列表显示缩略图
- [x] 更新后端接口支持imageUrl字段

## 配件添加表单验证错误修复
- [x] 检查后端parts.create接口的输入验证规则
- [x] 修复categoryId和supplierId字段的null值处理
- [x] 确保表单提交时所有必填字段都有有效值

## 表单空值处理问题修复
- [x] 检查前端Parts.tsx中表单提交逻辑
- [x] 将空字符串转换为undefined
- [x] 确保所有可选字段都能接受空值
- [x] 修夏字段命名不一致问题（list -> listPrice）

## 配件添加后列表不刷新问题修复
- [x] 检查createMutation的onSuccess回调
- [x] 添加trpc缓存失效逻辑（utils.parts.list.invalidate）
- [x] 确保添加、更新、删除成功后列表自动刷新
