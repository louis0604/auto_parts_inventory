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

## 配件编辑后数据不更新问题修复
- [x] 检查updateMutation传递的数据字段
- [x] 修复onSubmit中编辑模式的数据传递，传递cleanData而不是部分字段
- [x] 更新parts.update接口的输入验证规则，添加所有新字段

## 订单详情查看和退货系统
- [x] 分析Excel数据结构，确定需要添加的字段（Date、Time、Type、Cust#等）
- [x] 更新salesInvoices表添加新字段（invoiceTime、type、customerNumber等）
- [x] 更新purchaseOrders表添加type字段支持退货
- [x] 创建销售发票详情查看组件，显示订单中的所有配件明细
- [x] 在销售发票列表中添加点击查看详情功能
- [x] 更新getSalesInvoiceById后端接口，JOIN配件、客户和用户表
- [x] 在采购订单列表中添加点击查看详情功能
- [x] 创建采购订单详情查看组件
- [x] 更新getPurchaseOrderById后端接口，JOIN配件、供应商和用户表
- [x] 为订单类型添加"Return"（退货）选项（schema已支持）
- [ ] 更新订单创建表单支持选择订单类型（待用户测试后完善）

## 库存交易类型和Credit/Warranty功能
- [x] 更新inventoryLedger表的transactionType字段，支持purchase、sale、credit、warranty、adjustment等类型
- [x] 迁移现有数据，将"in"改为"purchase"，"out"改为"sale"
- [x] 更新后端代码使用新的类型值
- [x] 优化库存记录显示，添加交易类型图标（↑↓）和类型标签
- [x] 创建Credits表存储退货记录（credits和creditItems）
- [x] 创建Warranties表存储保修记录（warranties和warrantyItems）
- [x] 后端API：credits和warranties的CRUD接口（list/getById/create/cancel/updateStatus）
- [x] 后端逻辑：Credit创建后库存增加，Warranty创建后库存减少
- [x] 创建Credit管理页面（退货单列表、创建表单、详情查看、取消功能）
- [x] 创建Warranty管理页面（保修单列表、创建表单、详情查看、状态管理）
- [x] 在侧边栏导航中添加Credit和Warranty入口
- [x] 在销售发票详情页添加“创建退货单”快捷按钮
- [x] 编写并通过Credits和Warranties功能的单元测试

## 删除功能修复
- [x] 检查数据库schema中所有外键关系（parts/customers/suppliers）
- [x] 更新forceDeletePart函数，添加creditItems、warrantyItems、lowStockAlerts关联删除
- [x] 更新forceDeleteCustomer函数，添加credits、warranties及其明细的关联删除
- [x] 更新forceDeleteSupplier函数，添加purchaseOrderItems关联删除，将配件supplierId设为null
- [x] 编写并通过所有强制删除功能的单元测试，确保测试数据可以被清理

## 操作日志系统和权限控制
- [ ] 创建audit_logs数据表（操作类型、操作人、时间、目标实体、变更内容）
- [ ] 实现操作日志记录函数（createAuditLog）
- [ ] 在所有create操作中集成日志记录
- [ ] 在所有update操作中集成日志记录
- [ ] 在所有delete操作中集成日志记录
- [ ] 实现删除权限检查中间件（仅管理员可删除）
- [ ] 更新前端删除按钮，根据用户角色显示/隐藏
- [ ] 创建操作日志管理页面（列表、筛选、搜索）
- [ ] 编写操作日志和权限控制的单元测试

## 退货单和保修单功能增强
- [x] 添加删除退货单的API（deleteCredit）
- [x] 添加删除保修单的API（deleteWarranty）
- [x] 为退货单添加状态管理（pending/completed/cancelled）
- [x] 实现根据配件SKU查询销售历史的API（getSalesHistoryByPartSku）
- [x] 创建销售历史查询演示页面，展示功能原理
- [x] 编写并通过测试验证所有新功能
- [x] 创建CreditFormWithSalesHistory组件，集成销售历史查询和选择功能
- [x] 创建WarrantyFormWithSalesHistory组件，集成销售历史查询和选择功能
- [x] 更新Credits.tsx使用新的创建表单组件
- [x] 更新Warranties.tsx使用新的创建表单组件
- [x] 在退货单详情页突出显示原始销售单号（绿色Badge）
- [x] 在保修单详情页突出显示原始销售单号（绿色Badge）
- [ ] 在前端添加删除退货单和保修单的按钮

## 可访问性错误修复
- [x] 修夏Credits.tsx中加载状态Dialog缺少DialogTitle的错误
- [x] 修夏Warranties.tsx中加载状态Dialog缺少DialogTitle的错误
- [x] 修夏SalesInvoices.tsx中打印预览Dialog缺少DialogTitle的错误
- [x] 检查所有其他页面的Dialog组件，确保符合可访问性标准

## 完整删除功能实现
- [x] 添加采购订单删除API（deletePurchaseOrder）
- [x] 添加销售发票删除API（deleteSalesInvoice）
- [x] 修复parts/customers/suppliers的delete方法，使用forceDelete处理关联
- [ ] 在配件管理页面添加删除按钮
- [ ] 在客户管理页面添加删除按钮
- [ ] 在供应商管理页面添加删除按钮
- [ ] 在采购订单页面添加删除按钮
- [ ] 在销售发票页面添加删除按钮
- [ ] 在退货单页面添加删除按钮
- [ ] 在保修单页面添加删除按钮
- [ ] 创建通用删除确认对话框组件
- [ ] 在删除确认对话框中显示关联数据数量
- [ ] 编写并通过所有删除功能的测试

## 销售发票状态管理
- [x] 添加salesInvoices的updateStatus API
- [x] 在销售发票列表页添加状态切换下拉菜单（pending/completed/cancelled）
- [x] 更新状态Badge显示，使用不同颜色区分三种状态
- [x] 编写并通过4个单元测试验证状态切换功能

## 配件管理页面重新设计
- [x] 更新parts表schema，添加新字段（replCost/avgCost/price1/price2/price3/orderPoint）
- [x] 创建配件操作历史查询API（parts.getHistory），返回该配件的所有操作记录
- [x] 创建PartsNew.tsx新的配件管理页面，显示所有新字段
- [x] 移除定价、编码、历史等不需要的页面链接
- [x] Part Number添加点击链接功能，跳转到操作历史页面
- [x] 创建PartHistory.tsx配件操作历史详情页面
- [x] 保留批量导入功能
- [x] 更新路由配置，替换为PartsNew页面

## 配件操作历史筛选功能
- [x] 在PartHistory页面添加时间范围筛选器（开始日期、结束日期）
- [x] 在PartHistory页面添加操作类型多选筛选器
- [x] 实现前端筛选逻辑
- [x] 显示筛选结果统计（记录数、总金额）
- [x] 测试筛选功能

## 配件操作历史页面错误修复
- [x] 修复统计金额计算错误（totalAmount.toFixed is not a function）
- [x] 修复嵌套<a>标签问题（nested anchor tags）

## 操作历史单号链接功能
- [x] 分析不同操作类型对应的详情页面路由
- [x] 在getPartHistory返回数据中添加记录ID字段
- [x] 更新PartHistory.tsx，将单号列转换为可点击链接
- [x] 根据操作类型跳转到对应详情页（销售发票/采购订单/退货单/保修单）
- [x] 测试所有类型的单号链接跳转功能

## 配件页面Select组件错误修复
- [x] 定位PartsNew.tsx中空值的Select.Item
- [x] 修复Select.Item的value属性，确保不为空字符串

## 配件页面布局优化
- [x] 从配件列表移除Repl Cost、Avg Cost、Price 1、Price 2、Price 3列
- [x] 在配件操作历史页面顶部信息区域添加价格字段显示
- [x] 修改操作历史单号链接，直接跳转到单据详情而非列表页

## 配件详情页重构
- [x] 在Part Number上方显示LINE Code
- [x] 将所有字段改为可编辑状态（输入框、下拉框）
- [x] 添加“保存修改”按钮统一提交更改
- [x] 添加“删除配件”功能按钮
- [x] 移除操作历史表格，改为添加链接跳转到独立页面
- [x] 创建parts.update tRPC mutation
- [x] 创建parts.delete tRPC mutation

## 操作历史界面改造
- [x] 将SalesHistoryDemo页面改造为通用操作历史界面
- [x] 集成配件操作历史筛选功能
- [x] 更新侧边栏导航，将“销售历史查询演示”改为“操作历史”
- [x] 支持按配件ID筛选或显示所有配件的操作历史

## 配件界面修复
- [x] 从/parts页面移除操作按钮列（编辑和删除按钮）
- [x] 在PartDetail页面移除图片URL输入框
- [x] 优化图片显示：按实际长宽比显示，自适应容器
- [x] 在图片区域添加上传功能（点击或拖拽上传）
- [x] 实现图片上传到S3并自动更新imageUrl
- [x] 测试图片上传和显示功能

## 配件详情页图片显示黑屏问题修复
- [x] 诊断图片显示黑屏的原因
- [x] 修复图片容器样式问题
- [x] 测试图片正常显示

## 配件详情页图片黑屏问题深度诊断
- [x] 检查浏览器控制台是否有图片加载错误
- [x] 验证数据库中imageUrl字段的实际值
- [x] 测试图片URL是否可访问
- [x] 修复图片加载问题
- [x] 验证修复效果

## 配件详情页图片完全黑屏问题修复
- [x] 检查浏览器控制台JavaScript错误
- [x] 检查图片元素是否正确渲染
- [x] 修复图片显示问题
- [x] 添加点击图片查看完整大图功能
- [x] 测试图片显示和大图查看功能

## 添加配件Dialog背景透明度问题修复
- [x] 定位PartsNew.tsx中的Dialog组件
- [x] 为Dialog添加不透明背景遮罩
- [x] 测试Dialog显示效果

## 将添加配件功能改为独立页面
- [x] 创建AddPart.tsx独立页面
- [x] 复用PartsNew.tsx中的表单逻辑
- [x] 在App.tsx中添加路由
- [x] 更新配件列表的“添加配件”按钮为路由导航
- [x] 测试添加配件功能

## 批量导入功能优化
- [x] 查看用户提供的Excel模板结构和字段
- [x] 将批量导入功能从Dialog改为独立页面
- [x] 更新批量导入按钮为路由导航
- [ ] 适配Excel模板格式（列名、字段映射）
- [ ] 实现Excel中图片提取和上传功能
- [ ] 生成符合模板格式的下载模板
- [ ] 测试批量导入功能（包含图片）

## Line Code管理界面创建
- [x] 创建LineCodes.tsx管理页面
- [x] 实现Line Code列表显示
- [x] 添加创建Line Code表单
- [x] 添加编辑Line Code功能
- [x] 添加删除Line Code功能（带确认对话框）
- [x] 在DashboardLayout侧边栏添加导航入口
- [x] 在App.tsx中添加路由配置
- [x] 测试所有功能

## 将所有Dialog改为独立页面（解决背景透明度问题）
- [x] 检查系统中所有使用Dialog的管理页面
- [x] 将Line Code添加/编辑改为独立页面
- [x] 将供应商添加/编辑改为独立页面
- [x] 将客户添加/编辑改为独立页面
- [x] 检查其他可能使用Dialog的功能
- [x] 更新所有相关路由配置
- [x] 测试所有改动后的功能

## 修复批量导入Excel字段映射错误
- [x] 检查BulkImportParts.tsx的Excel解析逻辑
- [x] 修复unitPrice字段映射（从用户模板的价格列映射）
- [x] 确保所有必填字段都有默认值或正确映射
- [x] 测试批量导入功能

## 修复批量导入空SKU错误并实现图片提取
- [x] 过滤掉SKU为空的行，避免验证错误
- [x] 实现Excel图片提取功能
- [x] 将提取的图片上传到S3
- [x] 关联图片URL到配件记录
- [x] 测试批量导入功能

## 修复批量导入后字段不显示的问题
- [x] 检查bulkCreate的字段映射
- [x] 修夏Line Code字段传递
- [x] 修复价格字段（listPrice, retail, replCost等）传递
- [x] 测试批量导入功能

## 添加配件删除功能
- [x] 检查Parts页面的表格结构
- [x] 在Order Point列后添加删除按钮列
- [x] 实现删除确认对话框
- [x] 测试删除功能

## 删除配件列表的编辑按钮
- [x] 从操作列中删除编辑按钮
- [x] 只保留删除按钮

## 添加配件批量删除功能
- [x] 在表格左侧添加复选框列
- [x] 在表头添加全选复选框
- [x] 添加选中状态管理（useState）
- [x] 添加批量删除按钮
- [x] 实现批量删除确认对话框
- [x] 实现批量删除API调用
- [x] 测试批量删除功能

## 优化删除逻辑
- [x] 修改单个删除按钮，当有多选时触发批量删除
- [x] 更新确认提示，显示“是否确认删除选中的X个配件”
- [x] 测试删除逻辑

## 实现配件软删除（归档）功能
- [x] 在parts表添加isArchived字段
- [x] 运行数据库迁移
- [x] 修改list API，默认过滤已归档配件
- [x] 添加archive API（归档配件）
- [x] 添加restore API（恢复配件）
- [x] 添加listArchived API（查看已归档配件）
- [x] 修改前端删除逻辑为归档
- [x] 添加“已归档”标签页
- [x] 实现恢复按钮
- [ ] 添加永久删除选项
- [x] 测试所有功能
