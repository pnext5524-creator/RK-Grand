
import React from 'react';
import { LayoutDashboard, Users, HardHat, Clock, CheckSquare, Settings, MessageSquare } from 'lucide-react';
import { ModuleType, Employee, Contractor, Task, TaskProject, User, Chat } from './types';

export const NAVIGATION_ITEMS = [
  { type: ModuleType.DASHBOARD, label: 'Главная', icon: <LayoutDashboard size={20} /> },
  { type: ModuleType.HR, label: 'Кадры (HR)', icon: <Users size={20} /> },
  { type: ModuleType.ENGINEERING, label: 'Инженерный состав', icon: <HardHat size={20} /> },
  { type: ModuleType.TIME_TRACKING, label: 'Табель', icon: <Clock size={20} /> },
  { type: ModuleType.TASKS, label: 'Задачи', icon: <CheckSquare size={20} /> },
  { type: ModuleType.CHAT, label: 'Мессенджер', icon: <MessageSquare size={20} /> },
  { type: ModuleType.ADMIN_SETTINGS, label: 'Управление доступом', icon: <Settings size={20} />, adminOnly: true },
];

export const INITIAL_ADMIN: User = {
  id: 'admin-001',
  login: 'admin',
  password: 'admin',
  fullName: 'Главный Администратор',
  role: 'ADMIN',
  permissions: {
    [ModuleType.DASHBOARD]: true,
    [ModuleType.HR]: true,
    [ModuleType.ENGINEERING]: true,
    [ModuleType.TIME_TRACKING]: true,
    [ModuleType.TASKS]: true,
    [ModuleType.CHAT]: true,
  }
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    fullName: 'Малышев Константин Сергеевич',
    position: 'Генеральный директор',
    department: 'Администрация',
    hireDate: '2015-01-10',
    resumeUrl: '#',
    phone: '+7 (921) 111-22-33',
    email: 'director@rk-grand.ru',
    history: [
      { id: 'h-d1', date: '2020-05-20', type: 'AWARD', description: 'Орден за заслуги перед отечественной промышленностью' }
    ]
  },
  {
    id: 'emp-002',
    fullName: 'Морозов Артем Викторович',
    position: 'Заместитель генерального директора',
    department: 'Администрация',
    hireDate: '2016-03-20',
    resumeUrl: '#',
    phone: '+7 (921) 444-55-66',
    email: 'morozov@rk-grand.ru',
    history: []
  },
  {
    id: 'emp-003',
    fullName: 'Волков Сергей Александрович',
    position: 'Главный инженер',
    department: 'Техническая дирекция',
    hireDate: '2018-11-05',
    resumeUrl: '#',
    phone: '+7 (921) 777-88-99',
    email: 'volkov@rk-grand.ru',
    history: [
      { id: 'h-e1', date: '2021-09-12', type: 'AWARD', description: 'Лучший рационализатор года' }
    ]
  },
  {
    id: 'emp-004',
    fullName: 'Зайцев Николай Михайлович',
    position: 'Главный энергетик',
    department: 'Энергоцех',
    hireDate: '2019-05-12',
    resumeUrl: '#',
    phone: '+7 (921) 333-22-11',
    email: 'zaitsev@rk-grand.ru',
    history: []
  },
  {
    id: 'emp-005',
    fullName: 'Лебедева Елена Николаевна',
    position: 'Главный бухгалтер',
    department: 'Бухгалтерия',
    hireDate: '2017-08-15',
    resumeUrl: '#',
    phone: '+7 (921) 555-44-33',
    email: 'lebedeva@rk-grand.ru',
    history: [
      { id: 'h-a1', date: '2022-12-30', type: 'AWARD', description: 'Почетная грамота ФНС' }
    ]
  },
  {
    id: 'emp-006',
    fullName: 'Минигулов Александр Равильевич',
    position: 'Начальник РСЦ',
    department: 'Ремонтно-строительный цех',
    hireDate: '2018-04-12',
    resumeUrl: '#',
    phone: '+7 (921) 666-77-88',
    email: 'minigulov@rk-grand.ru',
    history: []
  },
  {
    id: '1',
    fullName: 'Иванов Иван Иванович',
    position: 'Инженер ПТО',
    department: 'Технический отдел',
    hireDate: '2020-05-15',
    resumeUrl: '#',
    phone: '+7 (900) 123-45-67',
    email: 'ivanov@rk-grand.ru',
    history: [
      { id: 'h1', date: '2021-12-31', type: 'AWARD', description: 'Премия за успешный запуск линии' }
    ]
  },
  {
    id: '2',
    fullName: 'Петрова Анна Сергеевна',
    position: 'HR Менеджер',
    department: 'Отдел кадров',
    hireDate: '2021-02-20',
    resumeUrl: '#',
    phone: '+7 (911) 987-65-43',
    email: 'petrova@rk-grand.ru',
    history: []
  },
  {
    id: '3',
    fullName: 'Сидоров Алексей Петрович',
    position: 'Оператор варки',
    department: 'Цех варки целлюлозы',
    hireDate: '2019-11-01',
    resumeUrl: '#',
    phone: '+7 (950) 444-55-66',
    email: 'sidorov@rk-grand.ru',
    history: [
      { id: 'h3', date: '2023-01-15', type: 'PENALTY', description: 'Выговор за нарушение ТБ' }
    ]
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat-ai',
    name: 'RK-GrandGPT',
    type: 'DIRECT',
    creatorId: 'system',
    participantIds: ['admin-001', 'emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'ai-bot'],
    updatedAt: new Date().toISOString(),
    lastMessage: 'Я готов помочь вам с вопросами по заводу.',
    isMandatory: true,
    messages: [
      { id: 'ai-init', senderId: 'ai-bot', senderName: 'RK-GrandGPT', text: 'Здравствуйте! Я ваш персональный AI-ассистент ООО «РК-ГРАНД». Чем могу помочь сегодня?', type: 'text', timestamp: new Date().toISOString(), readBy: ['admin-001'] }
    ]
  },
  {
    id: 'chat-news',
    name: 'Новости Завода',
    type: 'CHANNEL_NEWS',
    creatorId: 'admin-001',
    participantIds: ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'admin-001'],
    updatedAt: new Date().toISOString(),
    lastMessage: 'График работы на праздники.',
    isMandatory: true,
    messages: [
      { id: 'mn1', senderId: 'admin-001', senderName: 'Администрация', text: 'Уважаемые коллеги! Ознакомьтесь с графиком работы в праздничные дни.', type: 'text', timestamp: new Date().toISOString() }
    ]
  },
  {
    id: 'chat-orders',
    name: 'Приказы и распоряжения',
    type: 'CHANNEL_ORDERS',
    creatorId: 'admin-001',
    participantIds: ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'admin-001'],
    updatedAt: new Date().toISOString(),
    lastMessage: 'Приказ №112 о технике безопасности.',
    isMandatory: true,
    messages: [
      { id: 'mo1', senderId: 'admin-001', senderName: 'Канцелярия', text: 'Опубликован новый приказ по ТБ.', type: 'text', timestamp: new Date().toISOString() }
    ]
  }
];

export const INITIAL_PROJECTS: TaskProject[] = [
  { id: 'p1', name: 'Модернизация выпарной станции', description: 'Основной проект технического перевооружения 2024' },
  { id: 'p2', name: 'Автоматизация HR-процессов', description: 'Внедрение новой системы учета кадров' },
  { id: 'p3', name: 'Общие задачи', description: 'Операционные задачи предприятия' }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Согласовать смету по КТП-4',
    description: 'Необходимо проверить корректность расценок в смете от АО ЭлектроСити и подписать у финдиректора.',
    assigneeId: 'emp-003',
    creatorId: 'emp-001',
    deadline: '2024-03-20',
    status: 'IN_PROGRESS',
    projectId: 'p1',
    attachments: [],
    comments: []
  }
];

export const INITIAL_CONTRACTORS: Contractor[] = [
  {
    id: 'c1',
    name: 'ООО Стройтехмонтаж',
    object: 'Модернизация выпарной станции',
    progress: 65,
    updatedAt: '2024-03-10T14:30:00Z',
    advance: { paid: true, amount: 1200000, date: '2023-10-01' },
    documents: [
      { id: 'd1', type: 'CONTRACT', name: 'Договор №45/23', date: '2023-09-15', url: '#' }
    ],
    workers: [{ id: 'cw1', fullName: 'Борисов С.П.', passNumber: 'PASS-1023', expiryDate: '2024-05-01' }],
    transport: [{ id: 't1', model: 'KAMAZ 65115', plate: 'A123BC 10', passExpiry: '2024-03-15' }]
  },
  {
    id: 'c2',
    name: 'АО ЭнергоСеть',
    object: 'Реконструкция СРК-1',
    progress: 42,
    updatedAt: '2024-03-11T09:00:00Z',
    advance: { paid: true, amount: 800000, date: '2023-11-15' },
    documents: [],
    workers: [],
    transport: []
  },
  {
    id: 'c3',
    name: 'СК ПетроСтрой',
    object: 'Узел очистки стоков',
    progress: 89,
    updatedAt: '2024-03-12T16:45:00Z',
    advance: { paid: true, amount: 2500000, date: '2023-08-20' },
    documents: [],
    workers: [],
    transport: []
  },
  {
    id: 'c4',
    name: 'ООО ТехноПром',
    object: 'Автоматизация склада',
    progress: 15,
    updatedAt: '2024-03-09T11:20:00Z',
    advance: { paid: false },
    documents: [],
    workers: [],
    transport: []
  },
  {
    id: 'c5',
    name: 'Группа МонтажСистема',
    object: 'Ремонт турбогенератора №2',
    progress: 77,
    updatedAt: '2024-03-12T10:30:00Z',
    advance: { paid: true, amount: 1500000, date: '2024-01-10' },
    documents: [],
    workers: [],
    transport: []
  }
];
