import prisma from '../../prisma/prisma.js'
import logger from '../utils/logger.js'

export const seedPlans = async () => {
  try {
    const plansCount = await prisma.plan.count()

    if (plansCount === 0) {
      logger.info('Seeding plans...')

      const plans = [
        {
          name: 'Basic',
          price: 1500,
          currency: 'NGN',
          interval: 'Monthly',
          features: [
            'Visibility to FicaGo Subscribers',
            'Post a single service'
          ],
          isPopular: true,
          role: 'VENDOR'
        },
        {
          name: 'Premium',
          price: 2500,
          currency: 'NGN',
          interval: 'Monthly',
          features: [
            'Visibility to FicaGo Subscribers',
            'Post multiple services',
            'Verification badge'
          ],
          isPopular: false,
          role: 'VENDOR'
        }
      ]

      await prisma.plan.createMany({
        data: plans
      })

      logger.info('Plans seeded successfully')
    } else {
      logger.info('Plans already exist, skipping seeding')
    }
  } catch (error) {
    logger.error('Error seeding plans:', error)
  }
}
