package repo

import (
	models2 "github.com/JorgeSaicoski/portfolio-manager/backend/internal/application/models"
)

type PortfolioRepository interface {
	Create(portfolio *models2.Portfolio) error
	GetByIDWithRelations(id uint) (*models2.Portfolio, error)
	GetByOwnerIDBasic(ownerID string, limit, offset int) ([]*models2.Portfolio, error)
	GetByIDBasic(id uint) (*models2.Portfolio, error)
	Update(portfolio *models2.Portfolio) error
	Delete(id uint) error
	List(limit, offset int) ([]*models2.Portfolio, error)
	CheckDuplicate(title string, ownerID string, id uint) (bool, error)
}

type ProjectRepository interface {
	Create(project *models2.Project) error
	GetByID(id uint) (*models2.Project, error)
	GetByOwnerIDBasic(ownerID string, limit, offset int) ([]*models2.Project, error)
	GetByCategoryID(categoryID string) ([]*models2.Project, error)
	Update(project *models2.Project) error
	UpdatePosition(id uint, position uint) error
	Delete(id uint) error
	List(limit, offset int) ([]*models2.Project, error)
	GetBySkills(skills []string) ([]*models2.Project, error)
	GetByClient(client string) ([]*models2.Project, error)
	CheckDuplicate(title string, categoryID uint, id uint) (bool, error)
}

type SectionRepository interface {
	Create(section *models2.Section) error
	GetByID(id uint) (*models2.Section, error)
	GetByIDWithRelations(id uint) (*models2.Section, error)
	GetByOwnerID(ownerID string, limit, offset int) ([]*models2.Section, error)
	GetByPortfolioID(portfolioID string) ([]*models2.Section, error)
	GetByPortfolioIDWithRelations(portfolioID string) ([]*models2.Section, error)
	GetByType(sectionType string) ([]*models2.Section, error)
	Update(section *models2.Section) error
	UpdatePosition(id uint, position uint) error
	Delete(id uint) error
	List(limit, offset int) ([]*models2.Section, error)
	CheckDuplicate(title string, portfolioID uint, id uint) (bool, error)
}

type SectionContentRepository interface {
	Create(content *models2.SectionContent) error
	GetByID(id uint) (*models2.SectionContent, error)
	GetBySectionID(sectionID uint) ([]models2.SectionContent, error)
	Update(content *models2.SectionContent) error
	UpdateOrder(id uint, order uint) error
	Delete(id uint) error
	CheckDuplicateOrder(sectionID uint, order uint, id uint) (bool, error)
}

type CategoryRepository interface {
	Create(category *models2.Category) error
	GetByID(id uint) (*models2.Category, error)
	GetByIDBasic(id uint) (*models2.Category, error)
	GetByIDWithRelations(id uint) (*models2.Category, error)
	GetByPortfolioID(portfolioID string) ([]*models2.Category, error)
	GetByPortfolioIDWithRelations(portfolioID string) ([]*models2.Category, error)
	GetByOwnerIDBasic(ownerID string, limit, offset int) ([]*models2.Category, error)
	Update(category *models2.Category) error
	UpdatePosition(id uint, position uint) error
	Delete(id uint) error
	List(limit, offset int) ([]*models2.Category, error)
}
