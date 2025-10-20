package repo

import (
	"github.com/JorgeSaicoski/portfolio-manager/backend/internal/models"
	"gorm.io/gorm"
)

type projectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{
		db: db,
	}
}

func (r *projectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

// GetByID For basic project info
func (r *projectRepository) GetByID(id uint) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("id = ?", id).
		First(&project).Error
	return &project, err
}

// GetByOwnerIDBasic For list views - only basic project info for a specific owner
func (r *projectRepository) GetByOwnerIDBasic(ownerID string, limit, offset int) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.Where("owner_id = ?", ownerID).
		Order("position ASC, created_at ASC").
		Limit(limit).Offset(offset).
		Find(&projects).Error
	return projects, err
}

// GetByCategoryID For list views - projects in a category
func (r *projectRepository) GetByCategoryID(categoryID string) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.Where("category_id = ?", categoryID).
		Order("position ASC, created_at ASC").
		Find(&projects).Error
	return projects, err
}

func (r *projectRepository) Update(project *models.Project) error {
	return r.db.Model(project).Where("id = ?", project.ID).Updates(project).Error
}

// UpdatePosition updates only the position field of a project
func (r *projectRepository) UpdatePosition(id uint, position uint) error {
	return r.db.Model(&models.Project{}).Where("id = ?", id).Update("position", position).Error
}

func (r *projectRepository) Delete(id uint) error {
	return r.db.Delete(&models.Project{}, id).Error
}

func (r *projectRepository) List(limit, offset int) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.Limit(limit).Offset(offset).
		Find(&projects).Error
	return projects, err
}

// GetBySkills Find projects by skills
func (r *projectRepository) GetBySkills(skills []string) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.Where("skills && ?", skills).
		Find(&projects).Error
	return projects, err
}

// GetByClient Find projects by client name
func (r *projectRepository) GetByClient(client string) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.Where("client = ?", client).
		Find(&projects).Error
	return projects, err
}

// CheckDuplicate checks if a project with the same title exists for the same category
// excluding the project with the given id (useful for updates)
func (r *projectRepository) CheckDuplicate(title string, categoryID uint, id uint) (bool, error) {
	var count int64
	query := r.db.Model(&models.Project{}).Where("title = ? AND category_id = ?", title, categoryID)

	// Exclude the current project when checking for duplicates (for updates)
	if id != 0 {
		query = query.Where("id != ?", id)
	}

	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
