import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from './transaction.repository';
import { ConfigService } from '@nestjs/config';
import { AppErrorConflict } from '../../support/errors/app.error';

jest.mock('../../infra/db/prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionRepository,
          useValue: {
            getBalance: jest.fn(),
            getLastByAccountId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(30),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<TransactionRepository>(
      TransactionRepository,
    ) as jest.Mocked<TransactionRepository>;
  });

  it('deve criar transação quando saldo suficiente e sem idempotência', async () => {
    transactionRepository.getBalance.mockResolvedValue(100);
    transactionRepository.getLastByAccountId.mockResolvedValue(null);
    transactionRepository.create.mockResolvedValue({
      id: 1,
      accountId: 'acc-1',
      amount: -50,
      createdAt: new Date(),
    });

    const result = await service.create({
      accountId: 'acc-1',
      amount: -50,
    });

    expect(transactionRepository.getBalance).toHaveBeenCalledWith('acc-1');
    expect(transactionRepository.getLastByAccountId).toHaveBeenCalledWith(
      'acc-1',
    );
    expect(transactionRepository.create).toHaveBeenCalledWith({
      accountId: 'acc-1',
      amount: -50,
    });
    expect(result.id).toBe(1);
  });

  it('deve lançar erro quando saldo ficar negativo', async () => {
    transactionRepository.getBalance.mockResolvedValue(-10);
    transactionRepository.getLastByAccountId.mockResolvedValue(null);

    await expect(
      service.create({
        accountId: 'acc-1',
        amount: -1,
      }),
    ).rejects.toBeInstanceOf(AppErrorConflict);

    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('deve lançar erro de idempotência quando mesma transação recente', async () => {
    const now = new Date();
    transactionRepository.getBalance.mockResolvedValue(10);
    transactionRepository.getLastByAccountId.mockResolvedValue({
      id: 1,
      accountId: 'acc-1',
      amount: -10,
      createdAt: now,
    });

    await expect(
      service.create({
        accountId: 'acc-1',
        amount: -10,
      }),
    ).rejects.toBeInstanceOf(AppErrorConflict);

    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('deve permitir nova transação quando última for antiga', async () => {
    const oldDate = new Date(Date.now() - 60 * 1000);
    transactionRepository.getBalance.mockResolvedValue(10);
    transactionRepository.getLastByAccountId.mockResolvedValue({
      id: 1,
      accountId: 'acc-1',
      amount: -10,
      createdAt: oldDate,
    });
    transactionRepository.create.mockResolvedValue({
      id: 2,
      accountId: 'acc-1',
      amount: -10,
      createdAt: new Date(),
    });

    const result = await service.create({
      accountId: 'acc-1',
      amount: -10,
    });

    expect(result.id).toBe(2);
    expect(transactionRepository.create).toHaveBeenCalled();
  });
});
